export const getChildIndex = (node: Node) => {
  var i = 0;
  let child: Node | null = node;
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
  } else {
    return findNodePath(node.parentNode!, endNode, [...path]);
  }
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
export const insetBefore = (newNode: Node, targetNode: Node) => {
  return targetNode?.parentNode?.insertBefore(newNode, targetNode);
};
export const insetAfter = (newNode: Node, targetNode: Node) => {
  return targetNode.parentNode?.insertBefore(newNode, targetNode.nextSibling);
};
