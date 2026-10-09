import { translationEnabled } from "./presentation-config";

export type Caption = { text: string; source: "en" | "es" };
export type TranslationCallbacks = {
  onStatus: (status: "listening" | "translating") => void;
  onCaption: (caption: Caption) => void;
  onError: (message: string) => void;
  signal?: AbortSignal;
};
export const MAX_SESSION_MS = 45 * 60 * 1000;

function captionHeaders(csrf: string) {
  // Keep the browser's actual origin available when the private Codespaces tunnel
  // rewrites Origin/Host. The production gateway still checks native Origin.
  return { "Content-Type": "application/json", "X-MMB-CSRF": csrf, "X-MMB-Page-Origin": window.location.origin };
}

export async function translationApi(action: string, body: unknown, csrf = "", signal?: AbortSignal) {
  const response = await fetch(`./translation-api/index.php?action=${action}`, {
    method: "POST", credentials: "same-origin", cache: "no-store", signal,
    headers: captionHeaders(csrf),
    body: JSON.stringify(body),
  });
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json"))
    throw new Error("Live translation needs the PHP backend. GitHub Pages can preview captions only. Open the private PHP pilot link for a microphone test.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Translation connection unavailable. Try again.");
  return data;
}

export async function startTranslation(callbacks: TranslationCallbacks): Promise<{ stop: () => void }> {
  if (!translationEnabled) throw new Error("Live translation is disabled.");
  if (!navigator.onLine) throw new Error("Connect to the internet to start live translation.");
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode)
    throw new Error("This browser cannot stream microphone audio here. Use a current browser over HTTPS.");
  const abort = new AbortController();
  let stopped = false;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let socket: WebSocket | undefined;
  let input: MediaStreamAudioSourceNode | undefined;
  let worklet: AudioWorkletNode | undefined;
  let mute: GainNode | undefined;
  let csrf = "";
  let sessionId = "";
  let deadline = 0;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let busy = false;
  let queued: Caption | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true; abort.abort(); queued = undefined;
    clearTimeout(maxTimer); clearInterval(keepAlive);
    window.removeEventListener("pagehide", stop);
    document.removeEventListener("visibilitychange", visibility);
    callbacks.signal?.removeEventListener("abort", stop);
    if (worklet) { worklet.port.onmessage = null; worklet.disconnect(); }
    input?.disconnect(); mute?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    void context?.close().catch(() => {});
    if (socket) { socket.onclose = null; socket.onerror = null; socket.close(); }
    if (csrf && sessionId) void fetch("./translation-api/index.php?action=stop", {
      method: "POST", credentials: "same-origin", keepalive: true,
      headers: captionHeaders(csrf),
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  };
  const fail = (message: string) => { if (!stopped) { stop(); callbacks.onError(message); } };
  const checkDeadline = () => {
    if (deadline && Date.now() >= deadline) { fail("Translation stopped at the 45-minute limit. Start a new session if needed."); return false; }
    return !stopped;
  };
  // Stop on backgrounding as well as exit; mobile timers may otherwise be suspended.
  const visibility = () => { if (document.hidden) fail("Translation stopped because the page went into the background. Start it again when ready."); };
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", visibility);
  callbacks.signal?.addEventListener("abort", stop, { once: true });
  const translate = async (phrase: Caption) => {
    queued = phrase;
    if (busy) return;
    busy = true;
    while (queued && checkDeadline()) {
      const current = queued; queued = undefined;
      callbacks.onStatus("translating");
      try {
        const result = await translationApi("text", { ...current, sessionId }, csrf, abort.signal);
        if (checkDeadline() && result.text) callbacks.onCaption({ text: result.text, source: current.source });
      } catch (error) { if (!stopped) fail(error instanceof Error ? error.message : "Translation unavailable."); }
    }
    busy = false;
    if (!stopped) callbacks.onStatus("listening");
  };
  try {
    if (callbacks.signal?.aborted) { stop(); throw new Error("Translation canceled."); }
    let auth = await translationApi("status", {}, "", abort.signal);
    if (!auth.enabled) throw new Error("Translation is disabled on this server.");
    if (!auth.authenticated) {
      const passphrase = window.prompt("Enter the presenter passphrase to start live captions. This is not an API key.");
      if (!passphrase) throw new Error("Translation canceled.");
      auth = await translationApi("unlock", { passphrase }, "", abort.signal);
    }
    csrf = auth.csrf;
    // Permission first, then mint the short-lived token immediately before connecting.
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
    if (stopped) { stream.getTracks().forEach(track => track.stop()); throw new Error("Translation canceled."); }
    stream.getAudioTracks().forEach(track => track.addEventListener("ended", () => fail("Microphone disconnected. Start translation again."), { once: true }));
    context = new AudioContext();
    await context.resume();
    if (context.state !== "running") throw new Error("Microphone audio could not start. Tap Start Translation again.");
    await context.audioWorklet.addModule("./pcm-worklet.js");
    const grant = await translationApi("session", {}, csrf, abort.signal);
    sessionId = grant.sessionId;
    if (stopped) throw new Error("Translation canceled.");
    deadline = Math.min(Date.now() + MAX_SESSION_MS, Number(grant.expiresAt) * 1000);
    if (!Number.isFinite(deadline)) throw new Error("Translation session configuration unavailable.");
    maxTimer = setTimeout(() => checkDeadline(), Math.max(0, deadline - Date.now()));
    const params = new URLSearchParams({ model: "nova-3", language: "multi", encoding: "linear16", sample_rate: String(context.sampleRate), channels: "1", punctuate: "true", interim_results: "false", endpointing: "100" });
    socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, ["bearer", grant.access_token]);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Speech connection timed out. Try again.")), 15000);
      const cancel = () => { clearTimeout(timer); reject(new Error("Translation canceled.")); };
      abort.signal.addEventListener("abort", cancel, { once: true });
      const done = () => { clearTimeout(timer); abort.signal.removeEventListener("abort", cancel); };
      socket!.onopen = () => { done(); resolve(); };
      socket!.onerror = socket!.onclose = () => { done(); reject(new Error("Deepgram connection failed. Check configuration and try again.")); };
    });
    if (!checkDeadline()) throw new Error("Translation canceled.");
    socket.onclose = () => fail("Speech connection ended. Start Translation to reconnect.");
    socket.onerror = () => fail("Speech connection failed. Check your connection and try again.");
    socket.onmessage = event => {
      if (!checkDeadline()) return;
      try {
        const message = JSON.parse(String(event.data));
        if (message.type === "Error") { fail("Speech service returned an error. Check Deepgram configuration."); return; }
        const alternative = message.channel?.alternatives?.[0];
        if (message.type !== "Results" || !message.is_final || !alternative?.transcript?.trim()) return;
        // Nova-3 reports language on words. Split code-switched phrases into language runs.
        const runs: Caption[] = [];
        for (const word of alternative.words || []) {
          const language = String(word.language || alternative.languages?.[0] || "").split("-")[0];
          if (language !== "en" && language !== "es") continue;
          const text = String(word.punctuated_word || word.word || "");
          const last = runs.at(-1);
          if (last?.source === language) last.text += " " + text;
          else runs.push({ source: language, text });
        }
        if (!runs.length) {
          const language = String(alternative.languages?.[0] || "").split("-")[0];
          if (language === "en" || language === "es") runs.push({ source: language, text: alternative.transcript.trim() });
        }
        // A caption is the latest phrase, not a scrolling transcript.
        for (const run of runs) if (run.text.trim()) void translate(run);
      } catch { fail("Speech response could not be read. Restart translation."); }
    };
    input = context.createMediaStreamSource(stream);
    worklet = new AudioWorkletNode(context, "microphone-pcm");
    mute = context.createGain(); mute.gain.value = 0;
    worklet.port.onmessage = event => {
      if (!checkDeadline() || socket?.readyState !== WebSocket.OPEN) return;
      if (socket.bufferedAmount > 2 * 1024 * 1024) { fail("Speech connection is too slow. Reconnect and try again."); return; }
      socket.send(event.data);
    };
    input.connect(worklet).connect(mute).connect(context.destination);
    keepAlive = setInterval(() => {
      if (checkDeadline() && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "KeepAlive" }));
    }, 5000);
    callbacks.onStatus("listening");
    return { stop };
  } catch (error) {
    stop();
    if (error instanceof DOMException && error.name === "NotAllowedError")
      throw new Error("Microphone permission was denied. Allow microphone access and try again.");
    throw error;
  }
}
