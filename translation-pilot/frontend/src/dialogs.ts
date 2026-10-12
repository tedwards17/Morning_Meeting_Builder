import { subscribeLanguage, t, uiText } from "./i18n";

type Kind = "confirm" | "prompt" | "alert";
let queue: Promise<unknown> = Promise.resolve();
function dialog(kind: Kind, message: string, initial = "", password = false): Promise<string | boolean | null> {
  const next = queue.then(() => new Promise<string | boolean | null>(resolve => {
    const previous = document.activeElement as HTMLElement | null;
    const element = document.createElement("dialog"); element.className = "mmb-ui-dialog";
    element.setAttribute("aria-modal", "true");
    const title = document.createElement("h2"); title.id = "mmb-dialog-title";
    element.setAttribute("aria-labelledby", title.id);
    const text = document.createElement("p");
    const form = document.createElement("form");
    const input = document.createElement("input"); input.value = initial; input.type = password ? "password" : "text";
    input.autocomplete = password ? "off" : "on";
    const actions = document.createElement("div"); actions.className = "actions";
    const cancel = document.createElement("button"); cancel.type = "button";
    const accept = document.createElement("button"); accept.type = "submit"; accept.className = "primary";
    const update = () => {
      title.textContent = t(kind === "confirm" ? "Confirm action" : kind === "prompt" ? "Enter information" : "Notice");
      text.textContent = uiText(message);
      input.setAttribute("aria-label", t(password ? "Presenter passphrase" : "Response"));
      cancel.textContent = t("Cancel"); accept.textContent = t(kind === "confirm" ? "Confirm" : "OK");
    };
    const unsubscribe = subscribeLanguage(update);
    let finished = false;
    const finish = (accepted: boolean) => {
      if (finished) return; finished = true; unsubscribe();
      const result = kind === "prompt" ? accepted ? input.value : null : accepted;
      element.remove(); if (previous?.isConnected) previous.focus(); resolve(result);
    };
    cancel.onclick = () => finish(false);
    form.onsubmit = event => { event.preventDefault(); finish(true); };
    element.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    // Keep presentation remotes from moving slides behind an open confirmation.
    element.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); finish(false); }
    });
    element.append(title, text); if (kind === "prompt") form.append(input);
    if (kind !== "alert") actions.append(cancel); actions.append(accept); form.append(actions); element.append(form);
    document.body.append(element); update();
    if (typeof element.showModal === "function") element.showModal(); else element.setAttribute("open", "");
    if (kind === "prompt") { input.focus(); input.select(); }
    else if (cancel.isConnected) cancel.focus();
    else accept.focus();
  }));
  queue = next.catch(() => undefined);
  return next;
}
export async function confirmUI(message: string): Promise<boolean> { return (await dialog("confirm", message)) === true; }
export async function promptUI(message: string, initial = "", password = false): Promise<string | null> { return await dialog("prompt", message, initial, password) as string | null; }
export async function alertUI(message: string): Promise<void> { await dialog("alert", message); }
