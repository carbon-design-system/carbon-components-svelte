export interface FolderNode {
  /** The folder's path. */
  id: string;
  text: string;
  hasChildren?: boolean;
  disabled?: boolean;
  nodes?: FolderNode[];
}

export function createFolderTree(rootLabel: string): {
  roots: FolderNode[];
  byId: Map<string, FolderNode>;
};

/**
 * Give the folder at `path` its subfolders. A subfolder already in the tree
 * keeps its own loaded children. Returns whether the folder is in the tree.
 */
export function setChildren(
  byId: Map<string, FolderNode>,
  path: string,
  listing: ReadonlyArray<{ path: string; name: string; kind: string }>,
  isDisabled?: (path: string) => boolean,
): boolean;
