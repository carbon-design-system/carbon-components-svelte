export interface FileManagerTexts {
  treeLabel: string;
  rootLabel: string;
  breadcrumbLabel: string;
  hiddenFolders: string;
  toolbarLabel: string;
  listLabel: (folder: string) => string;
  newFolder: string;
  untitledFolder: string;
  upload: string;
  uploadFolder: string;
  viewLabel: string;
  viewList: string;
  viewGrid: string;
  details: string;
  moveTo: string;
  delete: string;
  rename: string;
  open: string;
  cancel: string;
  columnName: string;
  columnSize: string;
  columnModified: string;
  columnOwner: string;
  selected: (count: number) => string;
  emptyTitle: string;
  emptySubtitle: string;
  loading: string;
  loadFailed: (folder: string) => string;
  retry: string;
  dropOverlay: (folder: string) => string;
  deleteTitle: (count: number, name: string) => string;
  deleteBody: string;
  moveTitle: (count: number, name: string) => string;
  moveConfirm: string;
  moveTreeLabel: string;
  moveInto: (folder: string) => string;
  renameLabel: (name: string) => string;
  renameEdit: string;
  renameSave: string;
  renameCancel: string;
  nameErrors: {
    empty: string;
    slash: string;
    dots: string;
    exists: string;
  };
  uploadsTitle: (done: number, total: number) => string;
  uploadCancel: string;
  uploadRetry: string;
  uploadDismiss: string;
  uploadClear: string;
  uploadQueued: string;
  uploadComplete: string;
  uploadCanceled: string;
  uploadFailed: string;
  detailsEmpty: string;
  detailsMany: (count: number) => string;
  detailKind: string;
  detailSize: string;
  detailModified: string;
  detailOwner: string;
  detailLocation: string;
  detailItems: string;
  closeDetails: string;
  previewUnavailable: string;
  previewLoadFailed: string;
  previewLabel: (name: string) => string;
  openFile: string;
  kindFolder: string;
  kindFile: string;
  announce: {
    opened: (folder: string, count: number) => string;
    createdFolder: (name: string) => string;
    renamed: (from: string, to: string) => string;
    moved: (count: number, folder: string) => string;
    movedSome: (moved: number, total: number, folder: string) => string;
    deleted: (count: number) => string;
    deletedSome: (deleted: number, total: number) => string;
    uploaded: (name: string) => string;
    uploadsDone: (count: number) => string;
    uploadsDoneSome: (count: number, failed: number) => string;
    uploadFailed: (name: string) => string;
    cut: (count: number) => string;
    cutCleared: string;
    error: (message: string) => string;
  };
}

export const FILE_MANAGER_TEXTS: FileManagerTexts;

export function resolveTexts(
  texts:
    | Partial<
        Omit<FileManagerTexts, "nameErrors" | "announce"> & {
          nameErrors: Partial<FileManagerTexts["nameErrors"]>;
          announce: Partial<FileManagerTexts["announce"]>;
        }
      >
    | undefined,
): FileManagerTexts;
