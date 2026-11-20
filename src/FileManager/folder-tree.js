// @ts-check
// The nodes of a lazily loaded folder tree for `TreeView`. A folder starts as
// a node that reports it has children; `setChildren` fills it in once its
// listing has loaded, and drops the expander for a folder with no subfolders.

/**
 * @typedef {Object} FolderNode
 * @property {string} id - The folder's path.
 * @property {string} text
 * @property {boolean} [hasChildren]
 * @property {boolean} [disabled]
 * @property {FolderNode[]} [nodes]
 */

/**
 * @param {string} rootLabel
 * @returns {{ roots: FolderNode[], byId: Map<string, FolderNode> }}
 */
export function createFolderTree(rootLabel) {
  /** @type {FolderNode} */
  const root = { id: "/", text: rootLabel, hasChildren: true };
  return { roots: [root], byId: new Map([["/", root]]) };
}

/** @param {Map<string, FolderNode>} byId @param {FolderNode} node */
function forget(byId, node) {
  for (const child of node.nodes ?? []) {
    byId.delete(child.id);
    forget(byId, child);
  }
}

/**
 * Give the folder at `path` its subfolders. A subfolder already in the tree
 * keeps its own loaded children, so reloading a folder does not close the
 * ones below it.
 * @param {Map<string, FolderNode>} byId
 * @param {string} path
 * @param {ReadonlyArray<{ path: string, name: string, kind: string }>} listing - Every entry of the folder, files too.
 * @param {(path: string) => boolean} [isDisabled]
 * @returns {boolean} Whether the folder is in the tree.
 */
export function setChildren(byId, path, listing, isDisabled) {
  const node = byId.get(path);
  if (!node) return false;
  const previous = new Map(
    (node.nodes ?? []).map((child) => [child.id, child]),
  );
  const next = [];
  for (const entry of listing) {
    if (entry.kind !== "folder") continue;
    const child = previous.get(entry.path) ?? {
      id: entry.path,
      text: entry.name,
      hasChildren: true,
    };
    child.text = entry.name;
    child.disabled = isDisabled?.(entry.path) || undefined;
    previous.delete(entry.path);
    byId.set(entry.path, child);
    next.push(child);
  }
  for (const gone of previous.values()) {
    byId.delete(gone.id);
    forget(byId, gone);
  }
  node.nodes = next;
  node.hasChildren = next.length > 0;
  return true;
}
