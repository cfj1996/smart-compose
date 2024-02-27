export const getChildIndex = (node: Node) => {
  let i = 0;
  let child: Node | null = node;
  // eslint-disable-next-line no-cond-assign,no-plusplus
  while ((child = child.previousSibling) != null) i++;
  return i;
};

export function findNodePath<
  T = {
    index: number;
    nodeType: number;
    isEnd: boolean;
  },
>(node: Node, endNode = document.documentElement, lastPaths: T[] = []): T[] {
  const path: T[] = [...lastPaths];
  path.push({
    index: getChildIndex(node),
    nodeType: node.nodeType,
    isEnd: node.parentNode?.lastChild === node,
  } as T);
  if (node.parentNode === endNode) {
    return [...path];
  }
  return findNodePath(node.parentNode!, endNode, [...path]);
}

export const removeNode = (node: Node) => {
  node.parentNode?.removeChild(node);
};
export const findEndNode = (el: Node): Node => {
  if (el.lastChild?.nodeType === 1) {
    return findEndNode(el.lastChild);
  }
  return el.lastChild || el;
};
export const insetBefore = (newNode: Node, targetNode: Node) =>
  targetNode?.parentNode?.insertBefore(newNode, targetNode);
export const insetAfter = (newNode: Node, targetNode: Node) =>
  targetNode.parentNode?.insertBefore(newNode, targetNode.nextSibling);

export const bindEvents = (
  el: HTMLElement,
  events: Record<string, (event: any) => void>
) => {
  Object.entries(events).forEach(([key, callback]) =>
    el.addEventListener(key, callback)
  );
};

export const setStyles = (
  el: HTMLElement,
  css: Partial<CSSStyleDeclaration>
) => {
  Object.entries(css).forEach(([key, value]) => {
    // eslint-disable-next-line no-param-reassign
    (el as HTMLDivElement).style[key as any] = value as any;
  });
};
export type Box = {
  contentHeight: number;
  contentWidth: number;
  width: number;
  height: number;
  top: number;
  left: number;
};
export const getBox = (el: HTMLElement): Box => ({
  contentHeight: el.scrollHeight,
  contentWidth: el.scrollWidth,
  width: el.offsetWidth,
  height: el.offsetHeight,
  top: el.offsetTop,
  left: el.offsetLeft,
});

export type Rect = DOMRect;
export const getScreenRect = (el: HTMLElement): Rect =>
  el.getBoundingClientRect();

export const gerEndContainer = () => {
  const range = window.getSelection?.(); // 创建range
  return range?.getRangeAt(0)?.endContainer;
};
