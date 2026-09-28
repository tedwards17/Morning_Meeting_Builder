import { api, hosted, translationPilot } from "./runtime";

export type Caption = { text: string; source: "en" | "es" };
export type TranslationCallbacks = {
  onStatus: (status: "listening" | "translating") => void;
  onCaption: (caption: Caption) => void;
  onError: (message: string) => void;
};

export async function startTranslation(callbacks: TranslationCallbacks): Promise<{ stop: () => void }> {
  if (!hosted && !translationPilot) throw new Error("Live translation needs a secure Azure connection. The GitHub Pages demo only previews captions.");
  if (!navigator.onLine) throw new Error("Connect to the internet to start live translation.");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot use a microphone here. Open the hosted site over HTTPS.");

  // The SDK is downloaded only after the presenter starts translation.
  const speech = await import("microsoft-cognitiveservices-speech-sdk");
  const { token, region } = await api("translation/session", {});
  if (typeof token !== "string" || typeof region !== "string")
    throw new Error("Speech service configuration is unavailable.");
  // Continuous language identification requires the Speech universal v2 endpoint.
  const config = speech.SpeechConfig.fromEndpoint(
  new URL(`wss://${region}.stt.speech.microsoft.com/speech/universal/v2`));
  config.authorizationToken = token;
  config.setProperty(speech.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
  const languages = speech.AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "es-MX"]);
  const input = speech.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = speech.SpeechRecognizer.FromConfig(config, languages, input);
  let stopped = false;
  let busy = false;
  let queued: { text: string; source: "en" | "es" } | undefined;
  const refresh: { current?: ReturnType<typeof setInterval> } = {};
  const stop = () => {
    if (stopped) return;
    stopped = true;
    queued = undefined;
    if (refresh.current) clearInterval(refresh.current);
    window.removeEventListener("pagehide", stop);
    const release = () => { recognizer.close(); input.close(); config.close(); };
    try { recognizer.stopContinuousRecognitionAsync(release, release); }
    catch { release(); }
  };
  const fail = (message: string) => {
    if (stopped) return;
    stop();
    callbacks.onError(message);
  };
  const translate = async (phrase: { text: string; source: "en" | "es" }) => {
    // Keep only the newest sentence when translation is slower than the speaker.
    queued = phrase;
    if (busy) return;
    busy = true;
    while (queued && !stopped) {
      const current = queued;
      queued = undefined;
      callbacks.onStatus("translating");
      try {
        const result = await api("translation/text", current);
        if (!stopped && result.text) callbacks.onCaption({ text: result.text, source: current.source });
      } catch {
        fail("Translation is unavailable. Check the connection and try again.");
      }
    }
    busy = false;
    if (!stopped) callbacks.onStatus("listening");
  };
  recognizer.recognized = (_sender, event) => {
    if (stopped || event.result.reason !== speech.ResultReason.RecognizedSpeech || !event.result.text?.trim()) return;
    let detected = "";
    try { detected = speech.AutoDetectSourceLanguageResult.fromResult(event.result).language.toLowerCase(); }
    catch { return; }
    if (detected.startsWith("en") || detected.startsWith("es"))
      void translate({ text: event.result.text.trim(), source: detected.startsWith("es") ? "es" : "en" });
  };
  recognizer.canceled = (_sender, event) => {
    if (!stopped) fail(event.reason === speech.CancellationReason.Error
      ? "Microphone or speech service unavailable. Try starting translation again."
      : "Translation stopped. Try starting it again.");
  };
  recognizer.sessionStopped = () => {
    if (!stopped) fail("Speech session ended. Try starting translation again.");
  };
  window.addEventListener("pagehide", stop);
  try {
    await new Promise<void>((resolve, reject) => recognizer.startContinuousRecognitionAsync(resolve, reject));
  } catch {
    stop();
    throw new Error("Could not start the microphone or speech service. Check permissions and try again.");
  }
  if (stopped) throw new Error("Translation stopped before it started.");
  // Speech tokens expire after ten minutes. Refresh the active recognizer, not just its config.
  refresh.current = setInterval(() => {
    void api("translation/session", {}).then((next) => {
      if (!stopped) recognizer.authorizationToken = next.token;
    }).catch(() => fail("Translation connection expired. Try starting it again."));
  }, 8 * 60 * 1000);
  callbacks.onStatus("listening");
  return { stop };
}
