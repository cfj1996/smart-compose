import { findEndNode, gerEndContainer, insetAfter, removeNode } from "@/utils";

export class SmartCompose {
  mirrorDom: HTMLElement | undefined;

  mode: "TEXTAREA" | "CONTENTEDITABLE";

  valueState = "";

  completionValueState = "";

  lastReqText = "";

  constructor(
    private config: {
      el: HTMLDivElement | HTMLTextAreaElement;
      getCompletionValue: (value: string) => Promise<string>;
    }
  ) {
    this.mode =
      this.config.el.tagName === "TEXTAREA" ? "TEXTAREA" : "CONTENTEDITABLE";
    this.init();
  }

  init() {
    if (this.config.el.tagName === "TEXTAREA") {
      this.renderMirror();
      this.bindTextAreaEvent();
    } else if (this.config.el.contentEditable) {
      this.bindEvent();
    }
  }

  // 渲染提示
  renderCompletion() {
    if (this.mode === "TEXTAREA") {
      const textNode = document.createTextNode(this.completionValueState);
      if (this.mirrorDom!.childNodes[1]) {
        this.mirrorDom!.replaceChild(textNode, this.mirrorDom!.childNodes[1]);
      } else {
        this.mirrorDom?.append(textNode);
      }
      this.syncScroll();
    } else if (this.completionValueState) {
      if (this.mirrorDom) {
        this.mirrorDom.innerHTML = this.completionValueState;
      } else {
        const endContainer = gerEndContainer() || findEndNode(this.config.el);
        const textNodeBox = document.createElement("span");
        textNodeBox.style.color = "rgb(117, 117, 117)";
        textNodeBox.style.whiteSpace = "pre-wrap";
        textNodeBox.dataset.isCompletion = "1";
        textNodeBox.innerHTML = this.completionValueState;
        console.log("endContainer", endContainer?.parentNode);
        insetAfter(textNodeBox, endContainer);
        this.mirrorDom = this.config.el.querySelector(
          `span[data-is-completion="1"]`
        ) as HTMLDivElement;
      }
    } else {
      const mirrorDom = this.config.el.querySelector(
        `span[data-is-completion="1"]`
      );
      if (mirrorDom) {
        removeNode(mirrorDom);
      }
      this.mirrorDom = undefined;
    }
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
    if (this.mode === "TEXTAREA") {
      this.renderMirror();
    }
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
    return /\n$/.test(this.valueState);
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
      if (this.mode === "TEXTAREA") {
        const newValue = this.valueState + this.completionValueState;
        (this.config.el as HTMLTextAreaElement).value = newValue;
        this.setValueState(newValue);
      } else {
        const textNode = document.createTextNode(this.completionValueState);
        this.mirrorDom?.parentNode!.replaceChild(textNode, this.mirrorDom);
      }
      this.setCompletionValueState("");
      this.collapseToEnd();
    }
  }

  bindTextAreaEvent() {
    this.config.el.addEventListener("input", event => {
      this.setValueState((event.target as HTMLTextAreaElement)?.value || "");
      if (this.hasCursorAtEnd()) {
        this.request();
      }
    });
    this.config.el.addEventListener("blur", () => {
      this.setCompletionValueState("");
    });
    // 按键tab 或者 右方向键 选取
    this.config.el.addEventListener("keydown", event => {
      console.log("event", event);
      const { keyCode } = event as KeyboardEvent;
      if (
        (keyCode === 9 || keyCode === 39) &&
        this.hasCursorAtEnd() &&
        this.completionValueState
      ) {
        event.preventDefault();
        this.useCompletionValue();
      }
    });
  }

  // 判断光标是否是在最后
  hasLastChild(node: Node): boolean {
    if (node.parentNode === this.config.el) {
      if (node.parentNode?.lastChild === node) {
        return true;
      }
      return false;
    }
    if (node.parentNode) {
      return this.hasLastChild(node.parentNode);
    }
    return false;
  }

  collapseToEnd() {
    if (this.mode === "TEXTAREA") {
      this.config.el.focus();
    } else {
      this.config.el.focus();
      const range = window.getSelection();
      // 选择elem下的所有子内容
      range?.selectAllChildren(this.config.el);
      // 光标移到最后
      range?.collapseToEnd();
    }
  }

  bindEvent() {
    this.config.el.addEventListener("keyup", event => {
      const endContainer = gerEndContainer();
      console.log("endContainer", endContainer);
      if (
        endContainer?.nodeType === 3 &&
        (this.mirrorDom ? endContainer?.nextSibling === this.mirrorDom : true)
      ) {
        const { keyCode } = event as KeyboardEvent;
        console.log("keyCode", keyCode, endContainer?.textContent?.trim());
        if (keyCode === 9 || keyCode === 39 || keyCode === 13) {
          this.setValueState("");
          this.setCompletionValueState("");
        } else {
          this.setValueState(endContainer?.textContent?.trim() || "");
          this.request();
        }
      } else {
        this.setValueState("");
        this.setCompletionValueState("");
      }
    });
    this.config.el.addEventListener("click", () => {
      const text = gerEndContainer()?.textContent;
      if (text && text === this.completionValueState) {
        this.useCompletionValue();
      } else {
        this.setCompletionValueState("");
      }
    });
    // 按键tab 或者 右方向键 选取
    this.config.el.addEventListener(
      "keydown",
      event => {
        const { keyCode } = event as KeyboardEvent;
        if ((keyCode === 9 || keyCode === 39) && this.completionValueState) {
          event.preventDefault();
          this.useCompletionValue();
        }
      },
      true
    );
  }
}
