import { bindEvents } from "@/utils";

export type TextareaOptions = {
  el: HTMLTextAreaElement;
  getCompletionValue: (value: string) => Promise<string>;
};

export class SmartComposeTextarea {
  mirrorDom: HTMLElement | undefined;

  valueState = "";

  completionValueState = "";

  lastReqText = "";

  constructor(private config: TextareaOptions) {
    this.init();
  }

  init() {
    this.renderMirror();
    this.bindEvent();
  }

  // 渲染提示
  renderCompletion() {
    const textNode = document.createTextNode(this.completionValueState);
    if (this.mirrorDom!.childNodes[1]) {
      this.mirrorDom!.replaceChild(textNode, this.mirrorDom!.childNodes[1]);
    } else {
      this.mirrorDom?.append(textNode);
    }
    this.syncScroll();
  }

  // 渲染textArea的镜镜像
  renderMirror() {
    if (!this.mirrorDom) {
      this.mirrorDom = document.createElement("div") as HTMLDivElement;
    }
    this.setMirrorDomStyle();
    this.mirrorDom!.innerHTML = `<span style="visibility: hidden;">${this.valueState}</span>`;
    if (!this.mirrorDom.parentNode) {
      this.config.el.parentNode!.insertBefore(this.mirrorDom, this.config.el);
    }
    this.syncScroll();
  }

  setValueState(value: string) {
    this.valueState = value;
    this.renderMirror();
  }

  setCompletionValueState(completionValue: string) {
    this.completionValueState = completionValue;
    this.renderCompletion();
  }

  setMirrorDomStyle() {
    const style = window.getComputedStyle(this.config.el);
    Object.entries(style)
      .filter(([key]) =>
        [
          "width",
          "height",
          "padding",
          "font",
          "lineHeight",
          "border",
          "top",
          "left",
          "bottom",
          "right",
          "margin",
          "whiteSpace",
          "wordWrap",
          "overflow",
        ].some(name => {
          const reg = new RegExp(`^${name}`);
          return reg.test(key);
        })
      )
      .forEach(([key, value]) => {
        this.mirrorDom!.style[key as any] = value;
      });
    this.mirrorDom!.style.position = "absolute";
    this.mirrorDom!.style.overflow = "hidden";
    this.mirrorDom!.style.zIndex = "1";
    this.mirrorDom!.style.pointerEvents = "none";
    this.mirrorDom!.style.borderColor = "transparent";
    this.mirrorDom!.style.color = "rgb(117, 117, 117)";
    this.mirrorDom!.style.whiteSpace = "pre-wrap";
  }

  syncScroll() {
    this.mirrorDom?.scrollTo(
      this.config.el.scrollLeft || 0,
      this.config.el.scrollTop || 0
    );
  }

  // 截取\n . 。; ；后面的字符串
  get lineText() {
    return (
      this.valueState
        .split(/(\n|\.|。|;|；)/)
        .pop()
        ?.trim() || ""
    );
  }

  // 包装一下请求解决时序问题
  request() {
    const text = this.lineText;
    this.setCompletionValueState("");
    if (!text || this.lastReqText === text) return;
    this.lastReqText = text;
    this.config.getCompletionValue(text).then(res => {
      if (text === this.lineText && this.lineText) {
        this.setCompletionValueState(res);
      }
    });
  }

  // 判断光标是否在结尾
  hasCursorAtEnd() {
    const textarea = this.config.el as HTMLTextAreaElement;
    return (
      textarea.selectionStart === textarea.selectionEnd &&
      textarea.selectionEnd === textarea.value.length
    );
  }

  // 选取
  useCompletionValue() {
    if (this.completionValueState) {
      const newValue = this.valueState + this.completionValueState;
      (this.config.el as HTMLTextAreaElement).value = newValue;
      this.setValueState(newValue);
      this.setCompletionValueState("");
      this.collapseToEnd();
    }
  }

  collapseToEnd() {
    this.config.el.focus();
  }

  bindEvent() {
    bindEvents(this.config.el, {
      input: event => {
        this.setValueState((event.target as HTMLTextAreaElement)?.value || "");
        if (this.hasCursorAtEnd()) {
          this.request();
        }
      },
      blur: () => {
        this.setCompletionValueState("");
      },
      keydown: (event: KeyboardEvent) => {
        const { keyCode } = event as KeyboardEvent;
        if (keyCode === 13 || keyCode === 27) {
          this.setCompletionValueState("");
        }
        if (
          keyCode === 9 &&
          this.hasCursorAtEnd() &&
          this.completionValueState
        ) {
          event.preventDefault();
          this.useCompletionValue();
        }
      },
    });
  }
}
