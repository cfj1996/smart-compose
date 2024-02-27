import {
  SmartComposeTextarea,
  TextareaOptions,
} from "./smart-compose-textarea";
import {
  ExitableOptions,
  SmartComposeExitable,
} from "./smart-compose-exitable";

export default function smartCompose(
  options: Omit<TextareaOptions | ExitableOptions, "el"> & {
    el: string | HTMLElement;
  }
) {
  const { el } = options;
  const dom = typeof el === "string" ? document.querySelector(el) : el;
  if (dom) {
    if (dom.nodeName === "TEXTAREA") {
      // eslint-disable-next-line no-new
      new SmartComposeTextarea(options as TextareaOptions);
      return;
    }
    if ((dom as HTMLDivElement).contentEditable === "true") {
      SmartComposeExitable(options as ExitableOptions);
      return;
    }
  }
  throw new Error("Invalid node");
}
