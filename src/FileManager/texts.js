// @ts-check

/** @param {number} count @param {string} one @param {string} other */
function plural(count, one, other) {
  return `${count} ${count === 1 ? one : other}`;
}

/**
 * Every string `FileManager` shows or announces. Pass a partial object as
 * `texts` to replace some; the rest keep these defaults. A function entry
 * builds a string from values.
 */
export const FILE_MANAGER_TEXTS = {
  treeLabel: "Folders",
  rootLabel: "My files",
  breadcrumbLabel: "Folder path",
  hiddenFolders: "Hidden folders",
  toolbarLabel: "File actions",
  /** @param {string} folder */
  listLabel: (folder) => `Files in ${folder}`,
  newFolder: "New folder",
  untitledFolder: "Untitled folder",
  upload: "Upload files",
  uploadFolder: "Upload folder",
  viewLabel: "View",
  viewList: "List view",
  viewGrid: "Grid view",
  details: "Details",
  moveTo: "Move to…",
  delete: "Delete",
  rename: "Rename",
  open: "Open",
  cancel: "Cancel",
  columnName: "Name",
  columnSize: "Size",
  columnModified: "Modified",
  columnOwner: "Owner",
  /** @param {number} count */
  selected: (count) => `${count} ${count === 1 ? "item" : "items"} selected`,
  emptyTitle: "This folder is empty",
  emptySubtitle: "Drop files here, or choose Upload.",
  loading: "Loading files",
  /** @param {string} folder */
  loadFailed: (folder) => `Couldn't load ${folder}`,
  retry: "Retry",
  /** @param {string} folder */
  dropOverlay: (folder) => `Drop to upload to ${folder}`,
  /** @param {number} count @param {string} name */
  deleteTitle: (count, name) =>
    count === 1 ? `Delete "${name}"?` : `Delete ${count} items?`,
  deleteBody:
    "This can't be undone. A folder is deleted with everything in it.",
  /** @param {number} count @param {string} name */
  moveTitle: (count, name) =>
    count === 1 ? `Move "${name}"` : `Move ${count} items`,
  moveConfirm: "Move",
  moveTreeLabel: "Destination folder",
  /** @param {string} folder */
  moveInto: (folder) => `Move to ${folder}`,
  /** @param {string} name */
  renameLabel: (name) => `Rename ${name}`,
  renameEdit: "Rename",
  renameSave: "Save name",
  renameCancel: "Cancel rename",
  nameErrors: {
    empty: "Enter a name.",
    slash: "A name can't contain a slash.",
    dots: "That name isn't allowed.",
    exists: "An item with that name already exists.",
  },
  /** @param {number} done @param {number} total */
  uploadsTitle: (done, total) => `Uploads, ${done} of ${total} done`,
  uploadCancel: "Cancel upload",
  uploadRetry: "Retry upload",
  uploadDismiss: "Remove from list",
  uploadClear: "Clear finished",
  uploadQueued: "Waiting",
  uploadComplete: "Uploaded",
  uploadCanceled: "Canceled",
  uploadFailed: "Failed",
  detailsEmpty: "Select an item to see its details.",
  /** @param {number} count */
  detailsMany: (count) => `${count} items selected`,
  detailKind: "Kind",
  detailSize: "Size",
  detailModified: "Modified",
  detailOwner: "Owner",
  detailLocation: "Location",
  detailItems: "Items",
  closeDetails: "Close details",
  previewUnavailable: "There is no preview for this file.",
  previewLoadFailed: "The preview didn't load.",
  /** @param {string} name */
  previewLabel: (name) => `Preview of ${name}`,
  openFile: "Open",
  kindFolder: "Folder",
  kindFile: "File",
  announce: {
    /** @param {string} folder @param {number} count */
    opened: (folder, count) => `${folder}, ${plural(count, "item", "items")}`,
    /** @param {string} name */
    createdFolder: (name) => `Created folder ${name}`,
    /** @param {string} from @param {string} to */
    renamed: (from, to) => `Renamed ${from} to ${to}`,
    /** @param {number} count @param {string} folder */
    moved: (count, folder) =>
      `Moved ${plural(count, "item", "items")} to ${folder}`,
    /** @param {number} moved @param {number} total @param {string} folder */
    movedSome: (moved, total, folder) =>
      `Moved ${moved} of ${plural(total, "item", "items")} to ${folder}. The rest could not be moved.`,
    /** @param {number} count */
    deleted: (count) => `Deleted ${plural(count, "item", "items")}`,
    /** @param {number} deleted @param {number} total */
    deletedSome: (deleted, total) =>
      `Deleted ${deleted} of ${plural(total, "item", "items")}. The rest could not be deleted.`,
    /** @param {string} name */
    uploaded: (name) => `Uploaded ${name}`,
    /** @param {number} count */
    uploadsDone: (count) => `Uploaded ${plural(count, "file", "files")}`,
    /** @param {number} count @param {number} failed */
    uploadsDoneSome: (count, failed) =>
      `Uploaded ${plural(count, "file", "files")}. ${failed} failed.`,
    /** @param {string} name */
    uploadFailed: (name) => `Could not upload ${name}`,
    /** @param {number} count */
    cut: (count) =>
      `${plural(count, "item", "items")} ready to move. Open a folder and paste.`,
    cutCleared: "Cut cleared",
    /** @param {string} message */
    error: (message) => `Error: ${message}`,
  },
};

/**
 * @param {Partial<typeof FILE_MANAGER_TEXTS> | undefined} texts
 * @returns {typeof FILE_MANAGER_TEXTS}
 */
export function resolveTexts(texts) {
  if (!texts) return FILE_MANAGER_TEXTS;
  return {
    ...FILE_MANAGER_TEXTS,
    ...texts,
    nameErrors: { ...FILE_MANAGER_TEXTS.nameErrors, ...texts.nameErrors },
    announce: { ...FILE_MANAGER_TEXTS.announce, ...texts.announce },
  };
}
