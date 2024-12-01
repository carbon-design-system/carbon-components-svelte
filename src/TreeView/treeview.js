/**
 * Create a nested array from a flat array
 * @type {(flatArray: TreeNode[] & { pid?: any }[]) => TreeNode[]}
 */
export function toHierarchy(flatArray) {
  /** @type TreeNode[] */
  const tree = [];
  /** @type TreeNode[] */
  const childrenOf = [];

  flatArray.forEach((dstItem) => {
    const { id, pid } = dstItem;
    childrenOf[id] = childrenOf[id] || [];
    dstItem["nodes"] = childrenOf[id];

    if (pid) {
      // objects without pid are root level objects.
      childrenOf[pid] = childrenOf[pid] || [];
      delete dstItem.pid; // TreeNode type doesn't have pid.
      childrenOf[pid].push(dstItem);
    } else {
      delete dstItem.pid;
      tree.push(dstItem);
    }
  });

  // Remove the empty nodes props that make TreeView render a twistie.
  // Maybe this should actually be taken care of in TreeView itself? It makes
  // no sense i think that an empty nodes property render a twistie.
  function removeEmptyNodes(element) {
    element.forEach((elmt) => {
      if (elmt.nodes?.length === 0) delete elmt.nodes;
      else {
        removeEmptyNodes(elmt.nodes);
      }
    });
  }
  removeEmptyNodes(tree);
  return tree;
}

export default toHierarchy;
