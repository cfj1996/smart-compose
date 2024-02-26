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
  insetAfter,
  setStyles,
} from "@/utils";

type ExitableOptions = {
  el: HTMLDivElement | string;
  getCompletionValue: (text: string) => Promise<string>;
  offset?: [number, number];
};

function createCoverBox(
  coverBox: HTMLDivElement,
  contentBox: HTMLDivElement,
  exitableEl: HTMLDivElement
) {
  const { top, left, height, width, contentWidth, contentHeight } =
    getBox(exitableEl);
  setStyles(coverBox, {
    position: "absolute",
    zIndex: "1",
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    pointerEvents: "none",
    border: "1px solid red",
  });
  setStyles(contentBox, {
    width: `${contentWidth || width}px`,
    height: `${contentHeight || height}px`,
    padding: window.getComputedStyle(exitableEl).padding,
    margin: window.getComputedStyle(exitableEl).margin,
    border: "1px solid yellow",
  });
  coverBox.appendChild(contentBox);
  insetAfter(coverBox, exitableEl);
}

function updateContent(
  coverBox: HTMLDivElement,
  contentBox: HTMLDivElement,
  exitableEl: HTMLDivElement
) {
  const { top, left, height, width, contentWidth, contentHeight } =
    getBox(exitableEl);
  setStyles(coverBox, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
  setStyles(contentBox, {
    width: `${contentWidth || width}px`,
    height: `${contentHeight || height}px`,
  });
  coverBox.scrollTo(exitableEl.scrollLeft, exitableEl.scrollTop);
}

type Location = {
  copePosition: {
    left: number;
    top: number;
    height: number;
  };
  cssObj: CSSStyleDeclaration;
  cloneSpan: Node;
};

function getCursorLocation(): Location | null {
  const selection = window.getSelection();
  if (!selection) return null;
  const node = selection.getRangeAt(0).endContainer!;
  const span = document.createElement("span");
  if (node.nodeType === 3) {
    node.parentNode!.appendChild(span);
    const { top, left, height } = getBox(span);
    const cssObj = window.getComputedStyle(span);
    const cloneSpan = span.cloneNode();
    node.parentNode!.removeChild(span);
    return {
      copePosition: {
        left,
        top,
        height,
      },
      cssObj,
      cloneSpan,
    };
  }
  node.appendChild(span);
  const { top, left, height } = getBox(span);
  const cssObj = window.getComputedStyle(span);
  const cloneSpan = span.cloneNode();
  node.removeChild(span);
  return {
    copePosition: {
      left,
      top,
      height,
    },
    cssObj,
    cloneSpan,
  };
}

function createTooltip(
  contentBox: HTMLDivElement,
  text: string,
  position: {
    left: number;
    top: number;
    height: number;
  },
  cssObj: CSSStyleDeclaration,
  offset?: [number, number]
) {
  const { left, top, height } = position;
  if (!text.trim()) {
    while (contentBox.firstChild) {
      contentBox.removeChild(contentBox.firstChild);
    }
  } else {
    if (!contentBox.hasChildNodes()) {
      contentBox.appendChild(document.createElement("p"));
    }
    const tooltip = contentBox.firstChild as HTMLDivElement;
    setStyles(tooltip, {
      position: "relative",
      top: `${top - height + (offset?.[1] || 0)}px`,
      left: "0px",
      width: "100%",
      textIndent: `${left + (offset?.[0] || 0)}px`,
      font: cssObj.font,
      color: "rgb(117, 117, 117)",
      lineHeight: cssObj.lineHeight,
      whiteSpace: cssObj.whiteSpace,
      wordBreak: cssObj.wordBreak,
    });
    tooltip.innerHTML = text;
  }
}

function removeTooltip(contentBox: HTMLDivElement) {
  while (contentBox.firstChild) {
    contentBox.removeChild(contentBox.firstChild);
  }
}

function useCompletionValue(
  exitableEl: HTMLElement,
  contentBox: HTMLDivElement,
  completionValue: string
) {
  const selection = window.getSelection();
  const node = selection?.getRangeAt(0).endContainer!;
  const textNode = document.createTextNode(completionValue);
  insetAfter(textNode, node);
  removeTooltip(contentBox);
  exitableEl.focus();
  selection?.selectAllChildren(exitableEl);
  selection?.collapseToEnd();
}

export function SmartComposeExitable(options: ExitableOptions) {
  const exitableEl =
    typeof options.el === "string"
      ? (document.querySelector(options.el) as HTMLDivElement)
      : options.el;
  if (!exitableEl) throw new Error("Invalid node");
  if (exitableEl && exitableEl.contentEditable !== "true")
    throw new Error("Invalid node");
  const coverBox = document.createElement("div");
  const contentBox = document.createElement("div");
  createCoverBox(coverBox, contentBox, exitableEl);
  let location: Location | null = null;
  let completionValue = "";
  const request = (text: string) =>
    options.getCompletionValue(text).then(res => ({
      requesttext: text,
      res,
    }));
  bindEvents(exitableEl, {
    input: () => {
      const endNode = findEndNode(exitableEl);
      const selection = window.getSelection();
      const node = selection?.getRangeAt(0).endContainer!;
      completionValue = "";
      if (
        endNode.nodeType === 3 &&
        node?.nodeType === 3 &&
        endNode.textContent === node.textContent &&
        node.textContent
      ) {
        console.log("node.textContent", node.textContent);
        removeTooltip(contentBox);
        const text = node.textContent;
        request(text).then(data => {
          if (data.requesttext === text) {
            completionValue = data.res;
            updateContent(coverBox, contentBox, exitableEl);
            location = getCursorLocation();
            if (location) {
              createTooltip(
                contentBox,
                data.res,
                location?.copePosition,
                location?.cssObj,
                options.offset
              );
            }
          }
        });
      } else {
        removeTooltip(contentBox);
      }
    },
    keydown: (e: KeyboardEvent) => {
      console.log("keyCode", e.keyCode);
      const endNode = findEndNode(exitableEl);
      const selection = window.getSelection();
      const node = selection?.getRangeAt(0).endContainer!;
      if (
        e.keyCode === 9 &&
        completionValue &&
        endNode.nodeType === 3 &&
        node?.nodeType === 3 &&
        endNode.textContent === node.textContent &&
        node.textContent
      ) {
        useCompletionValue(exitableEl, contentBox, completionValue);
        completionValue = "";
        e.preventDefault();
      }
      updateContent(coverBox, contentBox, exitableEl);
      if (location) {
        createTooltip(
          contentBox,
          completionValue,
          location?.copePosition,
          location?.cssObj,
          options.offset
        );
      }
    },
    scroll: () => {
      updateContent(coverBox, contentBox, exitableEl);
    },
  });
}
