# Presentation remotes and practice fullscreen

Pair a Bluetooth keyboard/HID presenter with the tablet in its operating-system Bluetooth settings. For a wired keyboard or USB receiver, use a compatible USB adapter. Choose a remote whose manufacturer explicitly supports your tablet OS and keyboard / presentation mode. MMB needs browser keyboard events, not a Web Bluetooth connection or a Node service.

Standard navigation: next = Right, Down, Page Down, Space, Enter, Media Track Next; previous = Left, Up, Page Up, Backspace, Media Track Previous. Held-key repeats and modifier shortcuts are ignored. In Settings, use **Presentation remote → Learn next key / Learn previous key** to capture alternate plain keys. Mappings are saved in this device’s local settings. Reset restores the standard mapping. Press Escape to cancel learning; it is reserved for exiting fullscreen/presentation.

Remote navigation preserves fullscreen and immediately hides controls. Touch/click the slide to reveal them. Keyboard focus must be in the app: embedded YouTube controls can retain keyboard focus, so tap the slide outside the video before using the remote. The browser cannot intercept all keys sent inside a cross-origin YouTube iframe. Do not bind volume/shutter keys unless the tablet actually passes them as browser keyboard events; OS-reserved buttons may never reach the app.

Use Preview → Fullscreen preview for practice. It does not start speech capture or usage tracking. Closing practice exits fullscreen entered by that preview. Live presentation also has Fullscreen / Exit fullscreen. Fullscreen requires a user click and browser support. Some mobile browsers, including iPhone configurations, restrict document fullscreen; the app shows a fallback suggesting Add to Home Screen where supported. It cannot force browser controls to disappear.

Sources checked 2026-10-09:
- [MDN keyboard key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values)
- [MDN KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
- [Logitech USB / Bluetooth pairing instructions](https://support.logi.com/hc/en-gb/articles/360023347933)
- [Logitech supported OS / specifications](https://prosupport.logi.com/hc/en-001/articles/1500003925041-Specifications-Logitech-Spotlight-Presentation-Remote)
- [MDN requestFullscreen requirements](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)

Validation: Chromium keyboard events and fullscreen are exercised by the follow-up browser test. No physical remote or real tablet has been tested; confirm next/previous, touchscreen controls, microphone placement and YouTube focus on the actual purchased combination before a meeting.
