import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { t } from "./i18n";
const React = RecoveredReact as typeof RT;
export const FilePicker = React.forwardRef<HTMLInputElement, RT.InputHTMLAttributes<HTMLInputElement>>(function FilePicker(props, forwarded) {
  const input = React.useRef<HTMLInputElement | null>(null);
  const [names, setNames] = React.useState<string[]>([]);
  const ref = (element: HTMLInputElement | null) => {
    input.current = element;
    if (typeof forwarded === "function") forwarded(element);
    else if (forwarded) forwarded.current = element;
  };
  if (props.style?.display === "none" || props.hidden) return <input {...props} type="file" ref={ref}/>;
  return <span className="localized-file-picker">
    <input {...props} type="file" ref={ref} className="localized-file-native" onChange={event => {
      setNames(Array.from(event.target.files ?? []).map(file => file.name));
      props.onChange?.(event);
    }}/>
    <button type="button" disabled={props.disabled} onClick={()=>input.current?.click()}>{t(props.multiple ? "Choose files" : "Choose file")}</button>
    <span className="localized-file-name" aria-live="polite">{names.length ? names.join(", ") : t("No file selected")}</span>
  </span>;
});
