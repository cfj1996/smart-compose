export class SmartCompose {
  mirrorDom: HTMLDivElement | undefined;
  _valueState = "";
  _completionValueState = "";

  constructor(
    private config: {
      el: HTMLDivElement | HTMLTextAreaElement;
      getCompletionValue: (value: string) => Promise<string>;
    }
  ) {
    this.init();
  }

  init() {
    if (this.config.el.tagName === "TEXTAREA") {
      this.renderMirror();
      this.bindEvent();
    }
  }

  // 渲染提示
  renderCompletion() {
    const textNode = document.createTextNode(this._completionValueState);
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
    this.mirrorDom!.innerHTML = `<span style="visibility: hidden;">${this._valueState}</span>`;
    if (!this.mirrorDom.parentNode) {
      this.config.el.parentNode!.insertBefore(this.mirrorDom, this.config.el);
    }
    this.syncScroll();
  }

  setValueState(value: string) {
    this._valueState = value;
    this.renderMirror();
  }

  setCompletionValueState(completionValue: string) {
    this._completionValueState = completionValue;
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

  // 结尾是否是换行
  get isLineEnd() {
    return /\n$/.test(this._valueState);
  }

  // 截取\n . 。; ；后面的字符串
  get lineText() {
    const match = this._valueState.split(/(\n|\.|。|;|；)/);
    return match.pop()?.trim() || "";
  }

  // 包装一下请求解决时序问题
  request() {
    const text = this.lineText;
    this.setCompletionValueState("");
    if (!text) return;
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

  useCompletionValue() {
    if (this._completionValueState) {
      const newValue = this._valueState + this._completionValueState;
      (this.config.el as HTMLTextAreaElement).value = newValue;
      this.setValueState(newValue);
      this.setCompletionValueState("");
      this.config.el.focus();
    }
  }

  bindEvent() {
    this.config.el.addEventListener("input", event => {
      this.setValueState((event.target as HTMLTextAreaElement)?.value || "");
      if (this.hasCursorAtEnd()) {
        this.request();
      }
    });
    this.config.el.addEventListener("blur", () => {
      this.setCompletionValueState("");
    });
    // 安tab 或者 右方向键 选取
    this.config.el.addEventListener("keydown", event => {
      console.log("event", event);
      const keyCode = (event as KeyboardEvent).keyCode;
      if (
        (keyCode === 9 || keyCode === 39) &&
        this.hasCursorAtEnd() &&
        this._completionValueState
      ) {
        event.preventDefault();
        this.useCompletionValue();
      }
    });
  }
}
