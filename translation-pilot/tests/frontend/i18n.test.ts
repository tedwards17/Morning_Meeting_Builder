import { afterEach, describe, expect, it, vi } from "vitest";
import { getLanguage, getLocale, setLanguage, subscribeLanguage, t, uiError, uiLabel, uiText } from "../../frontend/src/i18n";
import { fieldLabel, fieldValue } from "../../frontend/src/ui-fields";
import { defaults } from "../../frontend/src/defaults";

afterEach(() => { setLanguage("en"); vi.unstubAllGlobals(); });
describe("interface language", () => {
  it("switches both ways and notifies mounted pages without a reload", () => {
    const listener = vi.fn(); const unsubscribe = subscribeLanguage(listener);
    expect(t("Save presentation")).toBe("Save presentation");
    setLanguage("es");
    expect(getLocale()).toBe("es-MX"); expect(t("Save presentation")).toBe("Guardar presentación");
    expect(uiLabel("administrator")).toBe("Administrador");
    setLanguage("en"); expect(uiLabel("administrator")).toBe("Administrator");
    expect(listener).toHaveBeenCalledTimes(2); unsubscribe();
  });
  it("remembers the device preference while tolerating unavailable storage", () => {
    const setItem = vi.fn(); vi.stubGlobal("localStorage", { setItem });
    setLanguage("es"); expect(setItem).toHaveBeenCalledWith("mmb-ui-language", "es");
    vi.stubGlobal("localStorage", { setItem() { throw Error("Disabled"); } });
    expect(() => setLanguage("en")).not.toThrow(); expect(getLanguage()).toBe("en");
  });
  it("localizes dynamic dialogs and already-visible status/error messages in either direction", () => {
    setLanguage("es");
    const message=t("Delete “{arg0}”? Past meetings will remain available.", {arg0:"Safety"});
    expect(message).toBe("¿Quieres eliminar “Safety”? Las reuniones anteriores seguirán disponibles.");
    expect(uiError(new Error("Presenter passphrase was not accepted."))).toBe("No se aceptó la frase de acceso del presentador.");
    expect(uiText("Deepgram quota or rate limit reached. Stop captions and try later.")).toContain("Se alcanzó la cuota");
    setLanguage("en"); expect(uiText(message)).toBe("Delete “Safety”? Past meetings will remain available.");
  });
  it("does not modify starter content, templates, transcript text or saved account identifiers", () => {
    const state=defaults(); const before=JSON.stringify(state);
    const spoken="Keep the aisle clear.";
    setLanguage("es"); t("Content library"); fieldLabel("transcript");
    expect(JSON.stringify(state)).toBe(before); expect(state.items[0].title).toBe(JSON.parse(before).items[0].title);
    expect(fieldValue("title","Safety")).toBe("Safety");
    expect(fieldValue("text",spoken)).toBe(spoken);
    expect(fieldValue("username","Home")).toBe("Home");
    expect(fieldValue("status","draft")).toBe("Borrador");
    expect(t("Unknown future key")).toBe("Unknown future key");
  });
});
