/**
 * @name: smart-compose-exitable.ts
 * @user: cfj
 * @date: 2024/2/26 22:28
 * @description：实现可编辑div的
 */
import {
  bindEvents,
  findEndNode,
  getBox,
  getScreenRect,
  insetAfter,
  removeNode,
  setStyles,
} from "@/utils";

export type ExitableOptions = {
  el: HTMLDivElement;
  getCompletionValue: (text: string) => Promise<string>;
  offset?: [number, number];
  clearLine?: boolean;
};

function createCoverBox(coverBox: HTMLDivElement, exitableEl: HTMLDivElement) {
  const { top, left, height, width } = getBox(exitableEl);
  setStyles(coverBox, {
    position: "absolute",
    zIndex: "1",
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    pointerEvents: "none",
  });
  insetAfter(coverBox, exitableEl);
}

function updateContent(coverBox: HTMLDivElement, exitableEl: HTMLDivElement) {
  const { top, left, height, width } = getBox(exitableEl);
  setStyles(coverBox, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
  coverBox.scrollTo(exitableEl.scrollLeft, exitableEl.scrollTop);
}

type Location = {
  textTop: number;
  textIndent: number;
  position: {
    top: number;
    left: number;
    width: number;
  };
  cssObj: CSSStyleDeclaration;
  cloneNode: Node;
};

function getCursorLocation(exitableEl: HTMLDivElement): Location | null {
  const selection = window.getSelection();
  if (!selection) return null;
  const node = selection.getRangeAt(0).endContainer!;
  const span = document.createElement("span");
  if (node.nodeType === 3) {
    node.parentNode!.appendChild(span);
    const spanParentNode = node.parentNode as HTMLElement;
    const textTop = getScreenRect(span).top - getScreenRect(spanParentNode).top;
    const textIndent =
      getScreenRect(span).left - getScreenRect(spanParentNode).left;
    const position = {
      top:
        getScreenRect(spanParentNode !== exitableEl ? spanParentNode : span)
          .top - getScreenRect(exitableEl).top,
      left:
        getScreenRect(spanParentNode !== exitableEl ? spanParentNode : span)
          .left - getScreenRect(exitableEl).left,
      width: getScreenRect(
        spanParentNode !== exitableEl ? spanParentNode : span
      ).width,
    };
    spanParentNode.removeChild(span);
    return {
      textTop,
      textIndent,
      position,
      cssObj: window.getComputedStyle(
        spanParentNode !== exitableEl ? spanParentNode : span
      ),
      cloneNode: spanParentNode.cloneNode(),
    };
  }
  node.appendChild(span);
  const spanParentNode = node as HTMLElement;
  const textTop = getScreenRect(span).top - getScreenRect(spanParentNode).top;
  const textIndent =
    getScreenRect(span).left - getScreenRect(spanParentNode).left;
  const position = {
    top:
      getScreenRect(spanParentNode !== exitableEl ? spanParentNode : span).top -
      getScreenRect(exitableEl).top,
    left:
      getScreenRect(spanParentNode !== exitableEl ? spanParentNode : span)
        .left - getScreenRect(exitableEl).left,
    width: getScreenRect(spanParentNode !== exitableEl ? spanParentNode : span)
      .width,
  };
  spanParentNode.removeChild(span);
  return {
    textTop,
    textIndent,
    position,
    cssObj: window.getComputedStyle(
      spanParentNode !== exitableEl ? spanParentNode : span
    ),
    cloneNode: spanParentNode.cloneNode(),
  };
}

function removeTooltip(coverBox: HTMLDivElement) {
  const tooltip = coverBox.firstChild;
  if (tooltip) {
    removeNode(tooltip);
  }
}

function createTooltip(
  text: string,
  location: Location,
  coverBox: HTMLDivElement,
  offset?: [number, number]
) {
  const { textTop, textIndent, position, cssObj, cloneNode } = location;
  const { top, left, width } = position;
  console.log("top, left, width", top, left, width);
  let tooltip = coverBox.firstChild;
  if (!text.trim()) {
    removeTooltip(coverBox);
  }
  if (!tooltip) {
    document.createElement(cloneNode.nodeName);
    tooltip = coverBox.appendChild(document.createElement(cloneNode.nodeName));
  }
  (tooltip as HTMLDivElement).innerHTML = text;
  setStyles(tooltip as HTMLDivElement, {
    margin: "0",
    position: "absolute",
    top: `${top + (offset?.[1] || 0)}px`,
    left: `${left}px`,
    width: `${width}px`,
    overflow: cssObj.overflow,
    paddingTop: `${textTop}px`,
    textIndent: `${textIndent + (offset?.[0] || 0)}px`,
    font: cssObj.font,
    color: "rgb(117, 117, 117)",
    lineHeight: cssObj.lineHeight,
    whiteSpace: cssObj.whiteSpace,
    wordBreak: cssObj.wordBreak,
  });
}

function useCompletionValue(
  exitableEl: HTMLElement,
  completionValue: string,
  coverBox: HTMLDivElement
) {
  const endNode = findEndNode(exitableEl);
  const selection = window.getSelection();
  const textNode = document.createTextNode(completionValue);
  insetAfter(textNode, endNode);
  removeTooltip(coverBox);
  exitableEl.focus();
  selection?.selectAllChildren(exitableEl);
  selection?.collapseToEnd();
}

const getEndContainerText = () => {
  const selection = window.getSelection();
  const node = selection?.getRangeAt(0)?.endContainer!;
  return node.textContent || "";
};

const hasCursorend = (exitableEl: HTMLDivElement) => {
  const endNode = findEndNode(exitableEl);
  const selection = window.getSelection();
  const node = selection?.getRangeAt(0)?.endContainer!;
  if (!selection) {
    return false;
  }
  if (!node) {
    return false;
  }
  if (node.nodeType === 3 && endNode.textContent === node.textContent) {
    return true;
  }
  if (node.nodeType === 1) {
    return selection.focusOffset === node.childNodes.length;
  }
  return false;
};

export function SmartComposeExitable(options: ExitableOptions) {
  const exitableEl = options.el;
  const coverBox = document.createElement("div");
  createCoverBox(coverBox, exitableEl);
  let completionValue = "";
  const request = (text: string) =>
    options.getCompletionValue(text).then(res => ({
      requesttext: text,
      res,
    }));
  let lasttext = "";
  bindEvents(exitableEl, {
    focus: () => {
      lasttext = getEndContainerText();
    },
    blur() {
      lasttext = "";
      completionValue = "";
      removeTooltip(coverBox);
    },
    input: () => {
      const endSelectText = getEndContainerText();
      completionValue = "";
      if (hasCursorend(exitableEl) && endSelectText !== lasttext) {
        removeTooltip(coverBox);
        request(endSelectText).then(data => {
          if (data.requesttext === lasttext) {
            completionValue = data.res;
            updateContent(coverBox, exitableEl);
            const location = getCursorLocation(exitableEl);
            if (location) {
              createTooltip(
                options.clearLine ? data.res?.replace(/\n/g, "") : data.res,
                location,
                coverBox,
                options.offset
              );
            }
          }
        });
      } else {
        removeTooltip(coverBox);
      }
      lasttext = endSelectText;
    },
    keydown: (e: KeyboardEvent) => {
      if (e.keyCode === 13 || e.keyCode === 27) {
        lasttext = "";
        completionValue = "";
        removeTooltip(coverBox);
      }
      if (e.keyCode === 9 && completionValue && hasCursorend(exitableEl)) {
        useCompletionValue(exitableEl, completionValue, coverBox);
        completionValue = "";
        e.preventDefault();
      }
    },
    scroll: () => {
      lasttext = "";
      completionValue = "";
      removeTooltip(coverBox);
    },
  });
}
