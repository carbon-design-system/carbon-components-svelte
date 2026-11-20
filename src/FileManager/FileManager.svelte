<script>
  /**
   * @typedef {import("../utils/file-system.js").FileEntry} FileEntry
   * @typedef {import("../utils/file-system.js").FileSystemAdapter} FileSystemAdapter
   * @typedef {import("./texts.js").FileManagerTexts} FileManagerTexts
   * @typedef {import("./file-manager-types.js").FileRow} FileRow
   */

  /**
   * @restProps {div}
   * @slot {{ entry: FileRow; url: string | undefined; }} preview - Replaces the preview of an entry in the details panel, for example with an image viewer.
   * @slot {{ path: string; }} empty - Replaces the empty folder message.
   */

  /**
   * @event {{ path: string }} navigate
   * @event {{ entry: FileEntry }} open - A file was activated. A folder opens in place.
   * @event {{ selectedIds: ReadonlyArray<string> }} change - The selection changed.
   * @event {{ from: string; to: string }} rename
   * @event {{ paths: ReadonlyArray<string>; destination: string }} move
   * @event {{ paths: ReadonlyArray<string> }} remove
   * @event {{ path: string; entry: FileEntry }} upload - A file finished uploading.
   * @event {{ operation: string; error: unknown }} error
   */

  /**
   * The file system to browse. See `createMemoryFileSystem` for one that
   * lives in memory, and `FileSystemAdapter` for the methods a real one needs.
   * @type {FileSystemAdapter}
   */
  export let adapter;

  /**
   * The folder that is open. Set it to navigate.
   * @bindable writable
   */
  export let path = "/";

  /**
   * How the open folder is shown.
   * @type {"list" | "grid"}
   * @bindable writable
   */
  export let view = "list";

  /**
   * The paths of the selected entries, in the open folder. One selection
   * serves both views, so it survives a switch of view and a sort.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * The column the open folder is sorted by. Folders always come first.
   * @type {"name" | "size" | "modified" | "owner"}
   * @bindable writable
   */
  export let sortKey = "name";

  /**
   * @type {"ascending" | "descending" | "none"}
   * @bindable writable
   */
  export let sortDirection = "ascending";

  /**
   * Set to `true` to show the details panel.
   * @bindable writable
   */
  export let detailsOpen = false;

  /**
   * The height of the file manager, as a CSS length.
   */
  export let height = "36rem";

  /** Specify the accessible name of the file manager. */
  export let labelText = "Files";

  /**
   * Replace some of the strings. Pass only the ones that change.
   * @type {Partial<FileManagerTexts>}
   */
  export let texts = {};

  /**
   * Choose the icon for an entry. Return an icon component.
   * @type {((entry: FileEntry) => any) | undefined}
   */
  export let iconFor = undefined;

  /**
   * How many folders a path shows before the middle ones collapse into a menu.
   */
  export let maxBreadcrumbs = 4;

  /**
   * The locale of the dates and sizes. The page's by default.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /** Specify the id of the root element. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Breadcrumb from "../Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "../Breadcrumb/BreadcrumbItem.svelte";
  import Button from "../Button/Button.svelte";
  import ConfirmModal from "../ConfirmModal/ConfirmModal.svelte";
  import DataTableSkeleton from "../DataTable/DataTableSkeleton.svelte";
  import Toolbar from "../DataTable/Toolbar.svelte";
  import ToolbarBatchActions from "../DataTable/ToolbarBatchActions.svelte";
  import ToolbarContent from "../DataTable/ToolbarContent.svelte";
  import DescriptionList from "../DescriptionList/DescriptionList.svelte";
  import DescriptionListItem from "../DescriptionList/DescriptionListItem.svelte";
  import EmptyState from "../EmptyState/EmptyState.svelte";
  import FileUploaderButton from "../FileUploader/FileUploaderButton.svelte";
  import Modal from "../Modal/Modal.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import SidePanel from "../SidePanel/SidePanel.svelte";
  import ToggleButton from "../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../ToggleButtonGroup/ToggleButtonGroup.svelte";
  import TreeView from "../TreeView/TreeView.svelte";
  import Edit from "../icons/Edit.svelte";
  import FolderAdd from "../icons/FolderAdd.svelte";
  import GridView from "../icons/GridView.svelte";
  import List from "../icons/List.svelte";
  import Move from "../icons/Move.svelte";
  import TrashCan from "../icons/TrashCan.svelte";
  import {
    hasDraggedFiles,
    readDroppedFiles,
    readInputFiles,
  } from "../utils/file-drop.js";
  import {
    baseName,
    isInside,
    joinPath,
    normalizePath,
    parentPath,
    pathTrail,
    sortEntries,
    uniqueName,
    validateName,
  } from "../utils/file-system.js";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { inlineGridKey, moveGridCursor } from "../utils/grid-move.js";
  import {
    pruneSelection,
    selectEvery,
    selectWith,
  } from "../utils/selection-model.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { isTypeaheadKey } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import FileManagerGrid from "./FileManagerGrid.svelte";
  import FileManagerList from "./FileManagerList.svelte";
  import FileManagerMoveDialog from "./FileManagerMoveDialog.svelte";
  import FileManagerPreview from "./FileManagerPreview.svelte";
  import FileManagerUploads from "./FileManagerUploads.svelte";
  import { defaultIcon, isImage, isPdf, isText } from "./file-kind.js";
  import { createFolderTree, setChildren } from "./folder-tree.js";
  import { resolveTexts } from "./texts.js";

  const dispatch = createEventDispatcher();

  const MIME = "application/x-ccs-file-manager";
  const UPLOAD_CONCURRENCY = 3;
  const HOVER_EXPAND_MS = 700;

  /** @type {string} */
  let currentPath = "/";
  /** @type {FileRow[]} */
  let rows = [];
  let loading = true;
  /** @type {unknown} */
  let loadError = null;
  /** @type {{ kind: "error" | "warning"; title: string; subtitle?: string } | null} */
  let notice = null;
  let announcement = "";

  /** Listings by path, shared by the tree, the move dialog and the open folder. */
  /** @type {Map<string, FileRow[]>} */
  const listings = new Map();

  let cursorId = "";
  /** @type {string | null} */
  let anchor = null;
  let renamingId = "";
  /** @type {string[]} */
  let cutIds = [];
  /** @type {string[]} */
  let dragIds = [];
  let dragDepth = 0;
  let overlay = false;
  /** @type {HTMLElement | null} */
  let dropElement = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let hoverTimer;
  let hoverPath = "";

  let deleteOpen = false;
  /** @type {string[]} */
  let deleteTargets = [];
  let moveOpen = false;
  /** @type {string[]} */
  let moveTargets = [];
  /** @type {FileRow | null} */
  let previewEntry = null;
  let previewOpen = false;
  /** @type {ReadonlyArray<File>} */
  let pickedFiles = [];
  /** @type {ReadonlyArray<File>} */
  let pickedFolder = [];

  /** @type {import("./FileManagerUploads.svelte").UploadItem[]} */
  let uploads = [];
  /** @type {Map<string, { file: File; controller: AbortController | null }>} */
  const uploadWork = new Map();
  let uploadSerial = 0;
  let uploadsDirty = false;

  let paneHeight = 400;
  let sidebarHeight = 560;
  /** @type {HTMLElement | null} */
  let sidebarRef = null;
  let gridColumns = 1;

  /** @type {HTMLDivElement | null} */
  let paneRef = null;
  /** @type {null | HTMLDivElement} */
  let gridRef = null;
  /** @type {null | HTMLDivElement} */
  let listRef = null;
  /** @type {null | { scrollToIndex: (index: number) => void; optionId: (index: number) => string }} */
  let gridView = null;
  /** @type {null | { scrollToIndex: (index: number) => void }} */
  let listView = null;

  let navToken = 0;
  /** @type {AbortController | null} */
  let navController = null;

  const folderTree = createFolderTree(resolveTexts(texts).rootLabel);
  let treeNodes = folderTree.roots;
  const treeById = folderTree.byId;
  /** @type {string[]} */
  let expandedIds = ["/"];
  /** @type {string[]} */
  let treeSelected = ["/"];
  let treeActive = "/";

  /** @param {string} label */
  function syncRootLabel(label) {
    const root = treeById.get("/");
    if (root && root.text !== label) {
      root.text = label;
      treeNodes = treeNodes;
    }
  }

  /** @type {Map<string, string | Promise<string>>} */
  const urlCache = new Map();

  let mounted = false;
  let prevSelection = selectedIds;

  $: t = resolveTexts(texts);
  $: syncRootLabel(t.rootLabel);

  $: sorted = sortRows(rows, sortKey, sortDirection);
  $: orderedIds = sorted.map((row) => row.id);
  $: rowsById = new Map(sorted.map((row) => [row.id, row]));
  $: siblingNames = new Set(rows.map((row) => row.name));
  $: if (rowsById) selectedIds = pruneToRows(selectedIds, rowsById);
  $: selectedRows = selectedIds
    .map((selected) => rowsById.get(selected))
    .filter((row) => row !== undefined);
  $: folderName = currentPath === "/" ? t.rootLabel : baseName(currentPath);
  $: listLabel = t.listLabel(folderName);
  $: trail = pathTrail(currentPath);
  $: if (path !== currentPath && mounted) openFolder(path);
  $: dispatchSelection(selectedIds);
  $: loadingMore = uploads.some(
    (item) => item.status === "queued" || item.status === "uploading",
  );
  $: iconOf = iconFor ?? defaultIcon;
  $: single = selectedRows.length === 1 ? selectedRows[0] : null;

  /** @param {ReadonlyArray<string>} next */
  function dispatchSelection(next) {
    if (next === prevSelection) return;
    prevSelection = next;
    dispatch("change", { selectedIds: next });
  }

  /**
   * @param {ReadonlyArray<FileRow>} list
   * @param {"name" | "size" | "modified" | "owner"} key
   * @param {"ascending" | "descending" | "none"} direction
   * @returns {FileRow[]}
   */
  function sortRows(list, key, direction) {
    return /** @type {FileRow[]} */ (sortEntries(list, key, direction));
  }

  /**
   * @param {ReadonlyArray<string>} ids
   * @param {Map<string, FileRow>} present
   */
  function pruneToRows(ids, present) {
    if (loading) return ids;
    const next = pruneSelection({ selected: ids, anchor }, present);
    if (next.anchor !== anchor) anchor = next.anchor;
    return next.selected === ids ? ids : next.selected;
  }

  /** @param {string} message */
  function announce(message) {
    announcement = "";
    tick().then(() => {
      announcement = message;
    });
  }

  /**
   * @param {string} operation
   * @param {unknown} error
   */
  function fail(operation, error) {
    const message = error instanceof Error ? error.message : String(error);
    notice = { kind: "error", title: message };
    announce(t.announce.error(message));
    dispatch("error", { operation, error });
  }

  /** @param {FileEntry} entry @returns {FileRow} */
  function toRow(entry) {
    return /** @type {FileRow} */ ({ ...entry, id: entry.path });
  }

  /**
   * @param {string} folder
   * @param {{ force?: boolean; signal?: AbortSignal }} [options]
   * @returns {Promise<FileRow[]>}
   */
  async function loadFolder(folder, { force = false, signal } = {}) {
    const cached = listings.get(folder);
    if (cached && !force) return cached;
    const list = (await adapter.list(folder, { signal })).map(toRow);
    listings.set(folder, list);
    if (setChildren(treeById, folder, list)) treeNodes = treeNodes;
    return list;
  }

  /** @param {string} prefix */
  function forgetUnder(prefix) {
    for (const key of [...listings.keys()]) {
      if (isInside(key, prefix)) listings.delete(key);
    }
  }

  /**
   * Open the tree down to `folder`, loading the folders on the way.
   * @param {string} folder
   */
  async function revealInTree(folder) {
    const next = new Set(expandedIds);
    for (const step of pathTrail(folder)) {
      if (step.path !== folder) {
        try {
          // Each level attaches its folders to the node the last one made.
          // biome-ignore lint/performance/noAwaitInLoops: top down, in order
          await loadFolder(step.path);
        } catch {
          break;
        }
        next.add(step.path);
      }
    }
    expandedIds = [...next];
    treeSelected = [folder];
    treeActive = folder;
  }

  /**
   * @param {string} folder
   * @param {{ select?: string[]; force?: boolean }} [options]
   */
  async function openFolder(folder, { select = [], force = false } = {}) {
    const target = normalizePath(folder);
    const token = ++navToken;
    navController?.abort();
    navController = new AbortController();
    const signal = navController.signal;
    const changed = target !== currentPath;
    currentPath = target;
    path = target;
    loading = true;
    loadError = null;
    notice = null;
    if (changed) {
      rows = [];
      selectedIds = [];
      anchor = null;
      cursorId = "";
      renamingId = "";
    }
    try {
      const list = await loadFolder(target, { force, signal });
      if (token !== navToken) return;
      rows = list;
    } catch (error) {
      if (token !== navToken) return;
      if (/** @type {any} */ (error)?.code === "aborted") return;
      rows = [];
      loadError = error;
      dispatch("error", { operation: "list", error });
    }
    loading = false;
    if (loadError) return;
    revealInTree(target);
    selectedIds = select;
    anchor = select[0] ?? null;
    cursorId = select[0] ?? sortRows(rows, sortKey, sortDirection)[0]?.id ?? "";
    if (changed) {
      dispatch("navigate", { path: target });
      announce(t.announce.opened(folderName, rows.length));
    }
  }

  /** @param {string[]} [select] */
  function reload(select) {
    return openFolder(currentPath, {
      select: select ?? [...selectedIds],
      force: true,
    });
  }

  /** Reload another folder in the cache, such as a move's destination. */
  async function refreshListing(/** @type {string} */ folder) {
    if (folder === currentPath) return;
    if (listings.has(folder)) {
      try {
        await loadFolder(folder, { force: true });
      } catch {
        listings.delete(folder);
      }
    }
  }

  function resolveUrl(/** @type {FileRow} */ entry) {
    if (entry.url) return entry.url;
    const cached = urlCache.get(entry.id);
    if (cached) return cached;
    const pending = Promise.resolve(adapter.url?.(entry.id));
    urlCache.set(entry.id, /** @type {Promise<string>} */ (pending));
    return /** @type {Promise<string>} */ (pending);
  }

  // ---------------------------------------------------------------- selection

  /** @param {{ selected: ReadonlyArray<string>; anchor: string | null }} state */
  function applySelection(state) {
    selectedIds = state.selected;
    anchor = state.anchor;
  }

  /**
   * @param {string} entryId
   * @param {{ shift?: boolean; toggle?: boolean }} modifiers
   */
  function selectEntry(entryId, modifiers) {
    cursorId = entryId;
    applySelection(
      selectWith(
        { selected: selectedIds, anchor },
        orderedIds,
        entryId,
        modifiers,
      ),
    );
  }

  function selectAll() {
    applySelection(selectEvery(orderedIds, { selected: selectedIds, anchor }));
  }

  function clearSelection() {
    applySelection({ selected: [], anchor: null });
  }

  // --------------------------------------------------------------- navigation

  /** @param {FileRow} entry */
  function activate(entry) {
    if (entry.kind === "folder") {
      openFolder(entry.id);
    } else {
      previewEntry = entry;
      previewOpen = true;
      dispatch("open", { entry });
    }
  }

  function goUp() {
    if (currentPath !== "/") {
      openFolder(parentPath(currentPath), { select: [currentPath] });
    }
  }

  /** @param {CustomEvent<{ id: string }>} event */
  function handleTreeSelect(event) {
    if (event.detail.id !== currentPath) openFolder(event.detail.id);
  }

  /** @param {CustomEvent<{ id: string; expanded: boolean; hasChildren?: boolean; nodes?: unknown[] }>} event */
  async function handleTreeToggle(event) {
    const node = event.detail;
    if (node.expanded && node.hasChildren && !listings.has(node.id)) {
      try {
        await loadFolder(node.id);
      } catch (error) {
        fail("list", error);
      }
    }
  }

  // ------------------------------------------------------------------ focus

  function focusPane() {
    if (rows.length === 0) paneRef?.focus({ preventScroll: true });
    else if (view === "grid") gridRef?.focus({ preventScroll: true });
    else focusRow(cursorId);
  }

  /**
   * Focus the list row, retrying while a virtualized window brings it in.
   * @param {string} entryId
   * @param {number} [tries]
   */
  function focusRow(entryId, tries = 6) {
    if (!listRef) return;
    const row = entryId
      ? listRef.querySelector(`tr[data-row="${CSS.escape(entryId)}"]`)
      : listRef.querySelector("tr[data-row]");
    if (row instanceof HTMLElement) {
      // A row mounted a moment ago has not been stamped yet.
      if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "-1");
      row.focus({ preventScroll: true });
    } else if (tries > 0) {
      requestAnimationFrame(() => focusRow(entryId, tries - 1));
    }
  }

  async function revealCursor() {
    await tick();
    const index = orderedIds.indexOf(cursorId);
    if (view === "grid") gridView?.scrollToIndex(index);
    else listView?.scrollToIndex(index);
  }

  /**
   * @param {string} target
   * @param {{ shift?: boolean; keep?: boolean }} [modifiers] - `keep` moves the cursor and leaves the selection alone.
   */
  async function moveCursorTo(target, modifiers = {}) {
    cursorId = target;
    if (modifiers.shift) {
      applySelection(
        selectWith({ selected: selectedIds, anchor }, orderedIds, target, {
          shift: true,
        }),
      );
    } else if (!modifiers.keep) {
      applySelection(
        selectWith({ selected: selectedIds, anchor }, orderedIds, target),
      );
    }
    await revealCursor();
    focusPane();
  }

  // ------------------------------------------------------------------ events

  /** @param {EventTarget | null} target */
  function entryElement(target) {
    return target instanceof Element
      ? target.closest("[data-file-path], tr[data-row]")
      : null;
  }

  /** @param {Element} element */
  function pathOf(element) {
    return (
      element.getAttribute("data-file-path") ??
      element.getAttribute("data-row") ??
      ""
    );
  }

  /** @param {EventTarget | null} target */
  function inEditor(target) {
    return (
      target instanceof Element && target.closest(".bx--edit-in-place") !== null
    );
  }

  /** @param {MouseEvent} event */
  function handlePaneClick(event) {
    if (renamingId || inEditor(event.target)) return;
    const target = /** @type {Element} */ (event.target);
    if (target.closest("input, label, button, a")) return;
    const element = entryElement(target);
    if (!element) {
      if (
        target.closest("[data-file-host='grid']") &&
        !target.closest("[role=option]")
      ) {
        clearSelection();
      }
      return;
    }
    const entryId = pathOf(element);
    selectEntry(entryId, {
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    });
    focusPane();
  }

  /** @param {MouseEvent} event */
  function handlePaneDblclick(event) {
    if (renamingId || inEditor(event.target)) return;
    const element = entryElement(event.target);
    const row = element ? rowsById.get(pathOf(element)) : undefined;
    if (row) activate(row);
  }

  /** @param {FocusEvent} event */
  function handlePaneFocusin(event) {
    // A row that took focus from the keyboard or a click holds the cursor.
    const target = event.target;
    if (
      view === "list" &&
      target instanceof HTMLElement &&
      target.matches("tr[data-row]")
    ) {
      cursorId = target.getAttribute("data-row") ?? cursorId;
    }
  }

  /** @param {KeyboardEvent} event */
  function handlePaneKeydown(event) {
    const target = /** @type {Element} */ (event.target);
    if (renamingId || inEditor(target)) return;
    const onGrid = target === gridRef;
    const onRow = target.matches("tr[data-row]");
    // An empty folder has no row to hold focus, so the pane takes it.
    if (!onGrid && !onRow && target !== paneRef) return;

    const mod = event.metaKey || event.ctrlKey;
    const key = event.key;
    const index = orderedIds.indexOf(cursorId);

    if (mod && key.toLowerCase() === "a") {
      event.preventDefault();
      selectAll();
      return;
    }
    if (mod && key.toLowerCase() === "x") {
      event.preventDefault();
      cut();
      return;
    }
    if (mod && key.toLowerCase() === "v") {
      event.preventDefault();
      paste();
      return;
    }
    if (event.altKey && key === "ArrowUp") {
      event.preventDefault();
      goUp();
      return;
    }

    const rtl = ref ? getComputedStyle(ref).direction === "rtl" : false;
    const columns = view === "grid" ? gridColumns : 1;
    const pageRows = Math.max(1, Math.floor(paneHeight / 32) - 1);
    const cursorKeys =
      view === "grid"
        ? [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
            "PageUp",
            "PageDown",
          ]
        : ["ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"];
    const plainOrEnds = !mod || key === "Home" || key === "End";
    if (plainOrEnds && !event.altKey && cursorKeys.includes(key)) {
      const move = moveGridCursor({
        index,
        count: orderedIds.length,
        columns,
        key: inlineGridKey(key, rtl),
        ctrl: mod || view === "list",
        pageRows:
          view === "grid"
            ? Math.max(1, Math.floor(paneHeight / 136) - 1)
            : pageRows,
      });
      if (move) {
        event.preventDefault();
        moveCursorTo(orderedIds[move.index], {
          shift: event.shiftKey,
          keep: mod && !event.shiftKey,
        });
      }
      return;
    }
    if (mod && cursorKeys.includes(key)) {
      const move = moveGridCursor({
        index,
        count: orderedIds.length,
        columns,
        key: inlineGridKey(key, rtl),
        pageRows,
      });
      if (move) {
        event.preventDefault();
        moveCursorTo(orderedIds[move.index], { keep: true });
      }
      return;
    }

    if (key === " " && cursorId) {
      event.preventDefault();
      selectEntry(cursorId, { toggle: true });
    } else if (key === "Enter" && cursorId) {
      event.preventDefault();
      const row = rowsById.get(cursorId);
      if (row) activate(row);
    } else if (key === "F2") {
      event.preventDefault();
      startRename();
    } else if (key === "Delete" || (mod && key === "Backspace")) {
      event.preventDefault();
      requestDelete();
    } else if (key === "Escape") {
      if (cutIds.length > 0) {
        cutIds = [];
        announce(t.announce.cutCleared);
      } else clearSelection();
    } else if (key.toLowerCase() === "m" && !mod && !event.altKey) {
      event.preventDefault();
      openMove();
    } else if (isTypeaheadKey(event)) {
      typeahead(key);
    }
  }

  let typeaheadBuffer = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typeaheadTimer;
  /** @param {string} key */
  function typeahead(key) {
    clearTimeout(typeaheadTimer);
    typeaheadBuffer += key.toLowerCase();
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer = "";
    }, 700);
    const start = Math.max(orderedIds.indexOf(cursorId), 0);
    const count = sorted.length;
    for (
      let offset = typeaheadBuffer.length > 1 ? 0 : 1;
      offset <= count;
      offset++
    ) {
      const row = sorted[(start + offset) % count];
      if (row.name.toLowerCase().startsWith(typeaheadBuffer)) {
        moveCursorTo(row.id);
        return;
      }
    }
  }

  // --------------------------------------------------------------- operations

  /** @param {string} [target] */
  function startRename(target = cursorId) {
    const row = rowsById.get(target);
    if (!row) return;
    renamingId = row.id;
    revealCursor();
  }

  /** @param {string} name @param {FileRow} entry */
  function validate(name, entry) {
    const trimmed = name.trim();
    if (trimmed === entry.name) return null;
    return validateName(trimmed, siblingNames);
  }

  /** @param {CustomEvent<{ entry: FileRow; name: string }>} event */
  async function commitRename(event) {
    const { entry, name } = event.detail;
    renamingId = "";
    if (name === entry.name || validate(name, entry) !== null) {
      focusPane();
      return;
    }
    const to = joinPath(parentPath(entry.id), name);
    try {
      await adapter.move(entry.id, to);
    } catch (error) {
      fail("rename", error);
      focusPane();
      return;
    }
    forgetUnder(entry.id);
    await reload([to]);
    cursorId = to;
    dispatch("rename", { from: entry.id, to });
    announce(t.announce.renamed(entry.name, name));
    await revealCursor();
    focusPane();
  }

  function cancelRename() {
    renamingId = "";
    tick().then(focusPane);
  }

  async function createFolder() {
    const name = uniqueName(t.untitledFolder, siblingNames, { folder: true });
    const target = joinPath(currentPath, name);
    try {
      await adapter.mkdir(target);
    } catch (error) {
      fail("mkdir", error);
      return;
    }
    await reload([target]);
    cursorId = target;
    announce(t.announce.createdFolder(name));
    await tick();
    startRename(target);
  }

  /** @param {PromiseSettledResult<unknown>[]} results */
  function firstRejection(results) {
    for (const result of results) {
      if (result.status === "rejected") return { reason: result.reason };
    }
    return null;
  }

  function targetsOf() {
    return selectedIds.length > 0
      ? [...selectedIds]
      : cursorId
        ? [cursorId]
        : [];
  }

  function requestDelete() {
    const targets = targetsOf();
    if (targets.length === 0) return;
    deleteTargets = targets;
    deleteOpen = true;
  }

  async function performDelete() {
    const targets = [...deleteTargets];
    const firstIndex = Math.min(
      ...targets
        .map((target) => orderedIds.indexOf(target))
        .filter((index) => index >= 0),
    );
    const results = await Promise.allSettled(
      targets.map((target) => adapter.remove(target)),
    );
    const removed = targets.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    for (const target of removed) forgetUnder(target);
    const failed = firstRejection(results);
    await reload([]);
    if (removed.length > 0) {
      dispatch("remove", { paths: removed });
      announce(
        removed.length === targets.length
          ? t.announce.deleted(removed.length)
          : t.announce.deletedSome(removed.length, targets.length),
      );
    }
    // Focus moves to the entry that took the deleted one's place, or the
    // pane when the folder is now empty, never to the page.
    const next = sorted[Math.min(firstIndex, sorted.length - 1)];
    cursorId = next?.id ?? "";
    await revealCursor();
    if (next) focusPane();
    else paneRef?.focus();
    if (failed && removed.length === 0) throw failed.reason;
    if (failed) fail("remove", failed.reason);
  }

  function openMove() {
    const targets = targetsOf();
    if (targets.length === 0) return;
    moveTargets = targets;
    moveOpen = true;
  }

  /**
   * @param {ReadonlyArray<string>} paths
   * @param {string} destination
   */
  function canMoveInto(paths, destination) {
    return (
      paths.length > 0 &&
      paths.every(
        (path) =>
          parentPath(path) !== destination && !isInside(destination, path),
      )
    );
  }

  /**
   * @param {ReadonlyArray<string>} paths
   * @param {string} destination
   */
  async function moveEntries(paths, destination) {
    const movable = paths.filter((path) => canMoveInto([path], destination));
    if (movable.length === 0) return;
    const firstIndex = Math.min(
      ...movable
        .map((path) => orderedIds.indexOf(path))
        .filter((index) => index >= 0),
    );
    const results = await Promise.allSettled(
      movable.map((path) =>
        adapter.move(path, joinPath(destination, baseName(path))),
      ),
    );
    const moved = movable.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failed = firstRejection(results);
    for (const path of moved) forgetUnder(path);
    listings.delete(destination);
    if (treeById.has(destination)) await refreshListing(destination);
    cutIds = [];
    await reload([]);
    if (moved.length > 0) {
      dispatch("move", { paths: moved, destination });
      const name = destination === "/" ? t.rootLabel : baseName(destination);
      announce(
        moved.length === movable.length
          ? t.announce.moved(moved.length, name)
          : t.announce.movedSome(moved.length, movable.length, name),
      );
    }
    if (failed) {
      fail("move", failed.reason);
    }
    const next = sorted[Math.min(Math.max(firstIndex, 0), sorted.length - 1)];
    cursorId = next?.id ?? "";
    await revealCursor();
    if (next) focusPane();
  }

  function cut() {
    const targets = targetsOf();
    if (targets.length === 0) return;
    cutIds = targets;
    announce(t.announce.cut(targets.length));
  }

  function paste() {
    if (cutIds.length > 0) moveEntries(cutIds, currentPath);
  }

  // ------------------------------------------------------------------- drag

  /** @param {EventTarget | null} target */
  function folderTargetOf(target) {
    if (!(target instanceof Element)) return null;
    const tree = target.closest("[data-tree-row-id]");
    if (tree)
      return {
        element: /** @type {HTMLElement} */ (tree),
        path: tree.getAttribute("data-tree-row-id") ?? "",
      };
    const crumb = target.closest("[data-drop-path]");
    if (crumb)
      return {
        element: /** @type {HTMLElement} */ (crumb),
        path: crumb.getAttribute("data-drop-path") ?? "",
      };
    const entry = entryElement(target);
    if (entry) {
      const row = rowsById.get(pathOf(entry));
      if (row?.kind === "folder")
        return { element: /** @type {HTMLElement} */ (entry), path: row.id };
    }
    return null;
  }

  /** @param {HTMLElement | null} element */
  function markDrop(element) {
    if (element === dropElement) return;
    dropElement?.removeAttribute("data-drop-target");
    dropElement = element;
    dropElement?.setAttribute("data-drop-target", "");
  }

  function clearDrag() {
    markDrop(null);
    clearTimeout(hoverTimer);
    hoverPath = "";
    dragDepth = 0;
    overlay = false;
  }

  /** @param {DragEvent} event */
  function handleDragstart(event) {
    const element = entryElement(event.target);
    if (!element || !event.dataTransfer) return;
    const entryId = pathOf(element);
    if (!selectedIds.includes(entryId)) selectEntry(entryId, {});
    dragIds = selectedIds.includes(entryId) ? [...selectedIds] : [entryId];
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(MIME, JSON.stringify(dragIds));
    event.dataTransfer.setData(
      "text/plain",
      dragIds.map((dragged) => baseName(dragged)).join("\n"),
    );
  }

  function handleDragend() {
    dragIds = [];
    clearDrag();
  }

  /** @param {string} target */
  function hoverExpand(target) {
    if (hoverPath === target) return;
    hoverPath = target;
    clearTimeout(hoverTimer);
    const node = treeById.get(target);
    if (!node?.hasChildren || expandedIds.includes(target)) return;
    hoverTimer = setTimeout(async () => {
      try {
        await loadFolder(target);
      } catch {
        return;
      }
      expandedIds = [...expandedIds, target];
    }, HOVER_EXPAND_MS);
  }

  /** @param {DragEvent} event */
  function handleDragenter(event) {
    if (hasDraggedFiles(event.dataTransfer)) {
      event.preventDefault();
      dragDepth++;
      overlay = true;
    }
  }

  /** @param {DragEvent} event */
  function handleDragover(event) {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;
    const folder = folderTargetOf(event.target);
    if (hasDraggedFiles(dataTransfer)) {
      event.preventDefault();
      dataTransfer.dropEffect = "copy";
      overlay = true;
      markDrop(folder?.element ?? null);
      return;
    }
    if (dragIds.length === 0) return;
    if (folder && canMoveInto(dragIds, folder.path)) {
      event.preventDefault();
      dataTransfer.dropEffect = "move";
      markDrop(folder.element);
      hoverExpand(folder.path);
    } else {
      markDrop(null);
      dataTransfer.dropEffect = "none";
    }
  }

  /** @param {DragEvent} event */
  function handleDragleave(event) {
    if (hasDraggedFiles(event.dataTransfer)) {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        overlay = false;
        markDrop(null);
      }
    }
  }

  /** @param {DragEvent} event */
  function handleDrop(event) {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;
    const folder = folderTargetOf(event.target);
    if (hasDraggedFiles(dataTransfer)) {
      event.preventDefault();
      const destination = folder?.path ?? currentPath;
      // The entries are read now: the browser empties `items` after this handler.
      const pending = readDroppedFiles(dataTransfer);
      clearDrag();
      pending
        .then((tree) => enqueue(tree, destination))
        .catch((error) => fail("upload", error));
      return;
    }
    if (dragIds.length > 0 && folder && canMoveInto(dragIds, folder.path)) {
      event.preventDefault();
      const paths = dragIds;
      dragIds = [];
      clearDrag();
      moveEntries(paths, folder.path);
    } else {
      dragIds = [];
      clearDrag();
    }
  }

  // ----------------------------------------------------------------- uploads

  /**
   * @param {import("../utils/file-drop.js").DroppedTree} tree
   * @param {string} destination
   */
  async function enqueue(tree, destination) {
    for (const folder of tree.folders) {
      try {
        // A folder is made after the one that holds it.
        // biome-ignore lint/performance/noAwaitInLoops: outermost first
        await adapter.mkdir(joinPath(destination, folder));
      } catch (error) {
        if (/** @type {any} */ (error)?.code !== "exists") {
          fail("mkdir", error);
          return;
        }
      }
    }
    const taken = new Set(destination === currentPath ? siblingNames : []);
    const items = [];
    for (const { file, path: relative } of tree.files) {
      let target = joinPath(destination, relative);
      if (!relative.includes("/")) {
        const name = uniqueName(relative, taken);
        taken.add(name);
        target = joinPath(destination, name);
      }
      const itemId = `${id}-upload-${++uploadSerial}`;
      uploadWork.set(itemId, { file, controller: null });
      items.push({
        id: itemId,
        name: baseName(target),
        path: target,
        size: file.size,
        loaded: 0,
        status: /** @type {const} */ ("queued"),
      });
    }
    uploads = [...uploads, ...items];
    pump();
  }

  /** @param {string} itemId @param {Partial<import("./FileManagerUploads.svelte").UploadItem>} patch */
  function patchUpload(itemId, patch) {
    uploads = uploads.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    );
  }

  function pump() {
    const running = uploads.filter(
      (item) => item.status === "uploading",
    ).length;
    const queued = uploads.filter((item) => item.status === "queued");
    for (const item of queued.slice(
      0,
      Math.max(0, UPLOAD_CONCURRENCY - running),
    )) {
      startUpload(item.id);
    }
    if (running + queued.length === 0 && uploadsDirty) finishUploads();
  }

  /** @param {string} itemId */
  function startUpload(itemId) {
    const work = uploadWork.get(itemId);
    const item = uploads.find((candidate) => candidate.id === itemId);
    if (!work || !item) return;
    work.controller = new AbortController();
    patchUpload(itemId, { status: "uploading", loaded: 0, message: undefined });
    adapter
      .upload(work.file, item.path, {
        signal: work.controller.signal,
        onProgress: (loaded) => patchUpload(itemId, { loaded }),
      })
      .then((entry) => {
        patchUpload(itemId, { status: "complete", loaded: item.size });
        uploadsDirty = true;
        dispatch("upload", { path: item.path, entry });
      })
      .catch((error) => {
        if (/** @type {any} */ (error)?.code === "aborted") {
          patchUpload(itemId, { status: "canceled" });
        } else {
          patchUpload(itemId, {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
          announce(t.announce.uploadFailed(item.name));
          dispatch("error", { operation: "upload", error });
        }
      })
      .finally(pump);
  }

  async function finishUploads() {
    uploadsDirty = false;
    const done = uploads.filter((item) => item.status === "complete").length;
    const failedCount = uploads.filter(
      (item) => item.status === "error",
    ).length;
    for (const key of [...listings.keys()]) {
      if (
        uploads.some(
          (item) => item.status === "complete" && isInside(item.path, key),
        )
      ) {
        listings.delete(key);
      }
    }
    await reload();
    announce(
      failedCount > 0
        ? t.announce.uploadsDoneSome(done, failedCount)
        : t.announce.uploadsDone(done),
    );
  }

  /** @param {CustomEvent<{ id: string }>} event */
  function cancelUpload(event) {
    const work = uploadWork.get(event.detail.id);
    if (work?.controller) work.controller.abort();
    else patchUpload(event.detail.id, { status: "canceled" });
  }

  /** @param {CustomEvent<{ id: string }>} event */
  function retryUpload(event) {
    patchUpload(event.detail.id, {
      status: "queued",
      loaded: 0,
      message: undefined,
    });
    pump();
  }

  /** @param {CustomEvent<{ id: string }>} event */
  function dismissUpload(event) {
    uploadWork.delete(event.detail.id);
    uploads = uploads.filter((item) => item.id !== event.detail.id);
  }

  function clearUploads() {
    uploads = uploads.filter(
      (item) => item.status === "queued" || item.status === "uploading",
    );
  }

  /** @param {CustomEvent<ReadonlyArray<File>>} event */
  function handlePicked(event) {
    const files = [...event.detail];
    pickedFiles = [];
    pickedFolder = [];
    enqueue(readInputFiles(files), currentPath);
  }

  // ------------------------------------------------------------------ views

  /** @param {CustomEvent<ReadonlyArray<string>>} event */
  function handleViewChange(event) {
    const next = event.detail[0];
    if (next === "list" || next === "grid") {
      view = next;
      tick().then(() => {
        revealCursor();
      });
    }
  }

  $: viewSelection = [view];

  // ----------------------------------------------------------------- public

  /** Reload the open folder from the adapter. */
  export function refresh() {
    listings.clear();
    treeById.get("/") && setChildren(treeById, "/", []);
    return openFolder(currentPath, { select: [...selectedIds], force: true });
  }

  /** Move focus into the entries. */
  export function focus() {
    focusPane();
  }

  /** Create a folder in the open folder and start naming it. */
  export function newFolder() {
    return createFolder();
  }

  onMount(() => {
    mounted = true;
    openFolder(path);
    const stopPane = paneRef
      ? observeResize(paneRef, () => {
          paneHeight = paneRef?.clientHeight ?? 400;
        })
      : () => {};
    const stopSidebar = sidebarRef
      ? observeResize(sidebarRef, () => {
          sidebarHeight = sidebarRef?.clientHeight ?? 560;
        })
      : () => {};
    return () => {
      stopPane();
      stopSidebar();
      clearTimeout(hoverTimer);
      clearTimeout(typeaheadTimer);
      navController?.abort();
      for (const work of uploadWork.values()) work.controller?.abort();
    };
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={ref}
  {id}
  class:bx--file-manager={true}
  class:bx--file-manager--dropping={overlay}
  role="group"
  aria-label={labelText}
  style:--ccs-file-manager-height={height}
  {...$$restProps}
  on:dragenter={handleDragenter}
  on:dragover={handleDragover}
  on:dragleave={handleDragleave}
  on:drop={handleDrop}
  on:dragstart={handleDragstart}
  on:dragend={handleDragend}
>
  <aside bind:this={sidebarRef} class:bx--file-manager__sidebar={true}>
    <TreeView
      id="{id}-tree"
      virtualize={{ containerHeight: sidebarHeight }}
      labelText={t.treeLabel}
      hideLabel
      size="default"
      nodes={treeNodes}
      bind:selectedIds={treeSelected}
      bind:expandedIds
      bind:activeId={treeActive}
      on:select={handleTreeSelect}
      on:toggle={handleTreeToggle}
    />
  </aside>

  <div class:bx--file-manager__main={true} id="{id}-main">
    <div class:bx--file-manager__bar={true}>
      <Breadcrumb labelText={t.breadcrumbLabel} noTrailingSlash>
        {#each trail as step, index (step.path)}
          {@const label = step.path === "/" ? t.rootLabel : step.name}
          {@const hidden =
            trail.length > maxBreadcrumbs &&
            index > 0 &&
            index < trail.length - (maxBreadcrumbs - 2)}
          {#if hidden}
            {#if index === 1}
              <BreadcrumbItem>
                <OverflowMenu
                  id="{id}-hidden-folders"
                  size="sm"
                  iconDescription={t.hiddenFolders}
                  flipped
                >
                  {#each trail.slice(1, trail.length - (maxBreadcrumbs - 2)) as hiddenStep (hiddenStep.path)}
                    <OverflowMenuItem
                      text={hiddenStep.name}
                      on:click={() => openFolder(hiddenStep.path)}
                    />
                  {/each}
                </OverflowMenu>
              </BreadcrumbItem>
            {/if}
          {:else if index === trail.length - 1}
            <BreadcrumbItem isCurrentPage data-drop-path={step.path}
              >{label}</BreadcrumbItem
            >
          {:else}
            <BreadcrumbItem
              href="#"
              data-drop-path={step.path}
              on:click={(event) => {
                event.preventDefault();
                openFolder(step.path);
              }}>{label}</BreadcrumbItem
            >
          {/if}
        {/each}
      </Breadcrumb>
      <div class:bx--file-manager__bar-actions={true}>
        <ToggleButtonGroup
          size="sm"
          selectionMode="single"
          required
          labelText={t.viewLabel}
          selected={viewSelection}
          on:change={handleViewChange}
        >
          <ToggleButton value="list" icon={List} iconDescription={t.viewList} />
          <ToggleButton
            value="grid"
            icon={GridView}
            iconDescription={t.viewGrid}
          />
        </ToggleButtonGroup>
        <Button
          kind="ghost"
          size="sm"
          isSelected={detailsOpen}
          on:click={() => (detailsOpen = !detailsOpen)}
        >
          {t.details}
        </Button>
      </div>
    </div>

    <Toolbar size="sm" ariaLabel={t.toolbarLabel}>
      <ToolbarBatchActions
        {selectedIds}
        formatTotalSelected={t.selected}
        on:cancel={clearSelection}
      >
        <Button
          icon={Edit}
          disabled={selectedIds.length !== 1}
          on:click={() => startRename(selectedIds[0])}>{t.rename}</Button
        >
        <Button icon={Move} on:click={openMove}>{t.moveTo}</Button>
        <Button icon={TrashCan} on:click={requestDelete}>{t.delete}</Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <Button
          kind="ghost"
          size="sm"
          icon={FolderAdd}
          iconDescription={t.newFolder}
          tooltipPosition="bottom"
          on:click={createFolder}
        />
        <FileUploaderButton
          id="{id}-upload"
          kind="ghost"
          size="sm"
          multiple
          disableLabelChanges
          labelText={t.upload}
          bind:files={pickedFiles}
          on:change={handlePicked}
        />
        <FileUploaderButton
          id="{id}-upload-folder"
          kind="ghost"
          size="sm"
          multiple
          directory
          disableLabelChanges
          labelText={t.uploadFolder}
          bind:files={pickedFolder}
          on:change={handlePicked}
        />
      </ToolbarContent>
    </Toolbar>

    {#if notice}
      <InlineNotification
        kind={notice.kind}
        title={notice.title}
        subtitle={notice.subtitle ?? ""}
        lowContrast
        on:close={() => (notice = null)}
      />
    {/if}

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      bind:this={paneRef}
      class:bx--file-manager__pane={true}
      tabindex={rows.length === 0 && !loading ? 0 : -1}
      on:click={handlePaneClick}
      on:dblclick={handlePaneDblclick}
      on:focusin={handlePaneFocusin}
      on:keydown={handlePaneKeydown}
    >
      {#if loadError}
        <div class:bx--file-manager__state={true}>
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title={t.loadFailed(folderName)}
            subtitle={loadError instanceof Error ? loadError.message : ""}
          />
          <Button kind="tertiary" size="sm" on:click={() => reload()}>
            {t.retry}
          </Button>
        </div>
      {:else if loading && rows.length === 0}
        <div
          class:bx--file-manager__state={true}
          role="status"
          aria-label={t.loading}
        >
          <DataTableSkeleton
            rows={8}
            columns={4}
            showHeader={false}
            showToolbar={false}
            size="short"
          />
        </div>
      {:else if rows.length === 0}
        <div class:bx--file-manager__state={true}>
          <slot name="empty" path={currentPath}>
            <EmptyState
              size="sm"
              title={t.emptyTitle}
              subtitle={t.emptySubtitle}
            />
          </slot>
        </div>
      {:else if view === "list"}
        <FileManagerList
          bind:this={listView}
          bind:ref={listRef}
          id="{id}-table"
          rows={sorted}
          bind:selectedIds
          bind:sortKey
          bind:sortDirection
          {cursorId}
          {renamingId}
          labelText={listLabel}
          height={paneHeight}
          iconFor={iconOf}
          texts={t}
          {validate}
          {locale}
          on:rename:save={commitRename}
          on:rename:cancel={cancelRename}
        />
      {:else}
        <FileManagerGrid
          bind:this={gridView}
          bind:ref={gridRef}
          bind:columns={gridColumns}
          entries={sorted}
          {selectedIds}
          {cursorId}
          {renamingId}
          labelText={listLabel}
          height={paneHeight}
          iconFor={iconOf}
          {resolveUrl}
          texts={t}
          {validate}
          idPrefix="{id}-grid"
          on:rename:save={commitRename}
          on:rename:cancel={cancelRename}
        />
      {/if}
      {#if overlay}
        <div class:bx--file-manager__drop={true} aria-hidden="true">
          <span>{t.dropOverlay(folderName)}</span>
        </div>
      {/if}
    </div>

    <FileManagerUploads
      id="{id}-uploads"
      items={uploads}
      texts={t}
      on:cancel={cancelUpload}
      on:retry={retryUpload}
      on:dismiss={dismissUpload}
      on:clear={clearUploads}
    />
  </div>

  <SidePanel
    id="{id}-details"
    bind:open={detailsOpen}
    slideIn
    selectorPageContent="#{id}-main"
    placement="end"
    size="sm"
    title={single
      ? single.name
      : selectedRows.length > 1
        ? t.detailsMany(selectedRows.length)
        : folderName}
    closeIconDescription={t.closeDetails}
  >
    {#if single}
      {#if isImage(single) || isPdf(single) || isText(single)}
        <slot name="preview" entry={single} url={undefined}>
          <FileManagerPreview entry={single} {resolveUrl} texts={t} />
        </slot>
      {/if}
      <DescriptionList gap={4}>
        <DescriptionListItem term={t.detailKind}>
          {single.kind === "folder"
            ? t.kindFolder
            : (single.type ?? t.kindFile)}
        </DescriptionListItem>
        {#if single.kind === "file" && single.size !== undefined}
          <DescriptionListItem term={t.detailSize}>
            {formatFileSize(single.size, { locale })}
          </DescriptionListItem>
        {/if}
        {#if single.modified !== undefined}
          <DescriptionListItem term={t.detailModified}>
            {new Date(single.modified).toLocaleString(locale)}
          </DescriptionListItem>
        {/if}
        {#if single.owner}
          <DescriptionListItem term={t.detailOwner}>
            {single.owner}
          </DescriptionListItem>
        {/if}
        <DescriptionListItem term={t.detailLocation}>
          {parentPath(single.id)}
        </DescriptionListItem>
      </DescriptionList>
    {:else if selectedRows.length > 1}
      <DescriptionList gap={4}>
        <DescriptionListItem term={t.detailItems}>
          {selectedRows.length}
        </DescriptionListItem>
        <DescriptionListItem term={t.detailSize}>
          {formatFileSize(
            selectedRows.reduce((sum, row) => sum + (row.size ?? 0), 0),
            { locale },
          )}
        </DescriptionListItem>
      </DescriptionList>
    {:else}
      <p>{t.detailsEmpty}</p>
      <DescriptionList gap={4}>
        <DescriptionListItem term={t.detailItems}>
          {rows.length}
        </DescriptionListItem>
      </DescriptionList>
    {/if}
  </SidePanel>

  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
</div>

<!-- The modals sit outside the root, which contains `position: fixed` for
     the details panel, so each one covers the page and not the file manager. -->
<ConfirmModal
  id="{id}-delete"
  bind:open={deleteOpen}
  title={t.deleteTitle(
    deleteTargets.length,
    deleteTargets.length === 1 ? baseName(deleteTargets[0]) : "",
  )}
  confirmText={t.delete}
  cancelText={t.cancel}
  confirm={performDelete}
  on:confirm:error={(event) => fail("remove", event.detail.error)}
>
  <p>{t.deleteBody}</p>
</ConfirmModal>

<FileManagerMoveDialog
  bind:open={moveOpen}
  paths={moveTargets}
  from={currentPath}
  {loadFolder}
  texts={t}
  rootLabel={t.rootLabel}
  id="{id}-move"
  on:move={(event) => moveEntries(moveTargets, event.detail.destination)}
/>

<Modal
  id="{id}-preview"
  bind:open={previewOpen}
  passiveModal
  size="lg"
  modalHeading={previewEntry?.name ?? ""}
  on:close={() => tick().then(focusPane)}
>
  {#if previewEntry}
    <FileManagerPreview
      entry={previewEntry}
      {resolveUrl}
      texts={t}
      size="large"
    />
  {/if}
</Modal>
