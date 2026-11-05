<script>
  /**
   * @typedef {object} PermissionsMatrixRole
   * @property {string} id
   * @property {string} label
   * @property {string | null} [parent] - The `id` of the role this one inherits from.
   * @property {boolean | string} [locked] - `true`, or the reason, to make every cell of the role read only.
   */

  /**
   * @typedef {object} PermissionsMatrixPermission
   * @property {string} id
   * @property {string} label
   * @property {PermissionsMatrixPermission[]} [children] - Makes the permission a group. A group row rolls up its children.
   * @property {boolean | string} [locked] - `true`, or the reason, to make every cell of the permission read only.
   */

  /**
   * @typedef {object} PermissionsMatrixLevel
   * @property {string} id
   * @property {string} label
   */

  /** @typedef {boolean | string} PermissionsMatrixValue */

  /** @typedef {Record<string, Record<string, PermissionsMatrixValue>>} PermissionsMatrixValues */

  /**
   * @typedef {object} PermissionsMatrixEdit
   * @property {string} roleId
   * @property {string} permissionId
   * @property {PermissionsMatrixValue | undefined} value - `undefined` removes the role's own entry, so it inherits again.
   */

  /**
   * @typedef {object} PermissionsMatrixChange
   * @property {string} roleId
   * @property {string} permissionId
   * @property {PermissionsMatrixValue | undefined} from - The saved value.
   * @property {PermissionsMatrixValue | undefined} to - The current value.
   */

  /**
   * @restProps {div}
   * @event {{ value: PermissionsMatrixValues; edits: PermissionsMatrixEdit[] }} change - Dispatched when a gesture edits the matrix, with the new `value` and the entries it wrote.
   * @event {{ value: PermissionsMatrixValues; changes: PermissionsMatrixChange[] }} save - Cancelable. Dispatched when Save is pressed. Call `preventDefault()` to keep the changes pending, such as while a request runs, and set `saved` when it succeeds.
   * @event {null} discard - Dispatched after Discard puts `value` back to the saved state.
   */

  /**
   * Specify the roles, one per column. A role with a `parent` inherits that
   * role's values for every permission it does not set itself.
   * @type {ReadonlyArray<PermissionsMatrixRole>}
   */
  export let roles = [];

  /**
   * Specify the permissions, one per row, as a tree. A permission with
   * `children` is a group: its row rolls up the children and collapses them.
   * @type {ReadonlyArray<PermissionsMatrixPermission>}
   */
  export let permissions = [];

  /**
   * Specify what each role sets: `value[roleId][permissionId]` is `true` or
   * `false` for a boolean matrix, or a level `id`. A role with no entry
   * inherits its parent's value, or takes the lowest level. The matrix
   * writes a new object on every edit and never changes the one it is given.
   * @type {PermissionsMatrixValues}
   * @bindable writable
   */
  export let value = {};

  /**
   * Specify the saved state that `value` is compared with. Changed cells
   * are marked, and the bar counts them. Set it to `value` once a request
   * succeeds. Left unset, the matrix keeps the `value` it was given as the
   * saved state, and Save moves it to the current `value`.
   * @type {PermissionsMatrixValues | undefined}
   * @bindable writable
   */
  export let saved = undefined;

  /**
   * Specify the levels a cell steps through, from the lowest to the highest,
   * such as `["none", "read", "write", "admin"]`. Unset, every cell is a
   * boolean: granted or not.
   * @type {ReadonlyArray<string | PermissionsMatrixLevel> | undefined}
   */
  export let levels = undefined;

  /**
   * Set to `true` to put permissions in columns and roles in rows. Groups
   * then collapse columns, and the permission headers are rotated by
   * `headerLayout` or wrapped.
   */
  export let transposed = false;

  /**
   * Specify the `id` of each collapsed group. Groups start expanded.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let collapsedIds = [];

  /** Specify the label text. */
  export let labelText = "";

  /** Set to `true` to visually hide the label text. */
  export let hideLabel = false;

  /**
   * Specify the row height. Also accepts Carbon v11's `"xs"`, `"sm"`,
   * `"md"`, `"lg"` and `"xl"`.
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the most the matrix grows to, in pixels. Past it the matrix
   * scrolls, and the headers stay in view. Required for `virtualize`.
   */
  export let height = 480;

  /** Specify the width of the first column, in pixels. */
  export let labelWidth = 240;

  /**
   * Specify the width of a role or permission column, in pixels. Defaults
   * to 112, or to the row height when `headerLayout` is `"rotated"`.
   * @type {number | undefined}
   */
  export let columnWidth = undefined;

  /**
   * Specify the height of the header row, in pixels. Defaults to 64, or
   * 128 when `headerLayout` is `"rotated"`.
   * @type {number | undefined}
   */
  export let headerHeight = undefined;

  /**
   * Specify how a column header fits its narrow column. `"wrap"` breaks
   * the label over up to three lines. `"rotated"` turns it with
   * `writing-mode`, so the text stays selectable and follows the page
   * direction, and the column shrinks to the row height.
   * @type {"wrap" | "rotated"}
   */
  export let headerLayout = "wrap";

  /**
   * Set to `true` to paint only the rows and columns in view, plus the one
   * with focus. Use it past a few thousand cells. Screen reader users then
   * reach the other rows by moving through the grid; `aria-rowcount` and
   * `aria-colcount` give the full size.
   */
  export let virtualize = false;

  /** Specify how many rows and columns to paint past the edge when `virtualize` is set. */
  export let overscan = 3;

  /**
   * Specify a function that returns a reason, or `true`, for each cell that
   * policy makes read only. A cell then shows the reason in a tooltip.
   * @type {((role: PermissionsMatrixRole, permission: PermissionsMatrixPermission) => string | boolean | null | undefined) | undefined}
   */
  export let lockReason = undefined;

  /**
   * Specify an id for the matrix.
   * @type {string | undefined}
   */
  export let id = undefined;

  /** Specify the text of the corner header when permissions run down the rows. */
  export let permissionsText = "Permissions";

  /** Specify the text of the corner header when roles run down the rows. */
  export let rolesText = "Roles";

  /** Specify the text a cell that overrides what its parent role grants is announced with. */
  export let revokedText = "Revoked here";

  /** Specify the text a group cell shows, with `levels`, when its children differ. */
  export let mixedText = "Mixed";

  /** Specify the text a changed cell is announced with. */
  export let changedText = "Changed";

  /**
   * Specify the text an inherited cell is announced with.
   * @type {(role: PermissionsMatrixRole) => string}
   */
  export let inheritedText = defaultInheritedText;

  /**
   * Specify the text a role's header is announced with when it inherits.
   * @type {(role: PermissionsMatrixRole) => string}
   */
  export let inheritsText = defaultInheritsText;

  /**
   * Specify the text a read only cell is announced with and shows in its tooltip.
   * @type {(reason: string) => string}
   */
  export let lockedText = defaultLockedText;

  /**
   * Specify the text of the change count in the bar.
   * @type {(count: number) => string}
   */
  export let changesText = defaultChangesText;

  /**
   * Specify the text of the selection count in the bar.
   * @type {(count: number) => string}
   */
  export let selectedText = defaultSelectedText;

  /**
   * Specify the text of the button that sets the selection to a level.
   * @type {(level: PermissionsMatrixLevel) => string}
   */
  export let setLevelText = defaultSetLevelText;

  /** Specify the text of the button that grants the selection. */
  export let grantText = "Grant";

  /** Specify the text of the button that revokes the selection. */
  export let revokeText = "Revoke";

  /** Specify the text of the button that makes the selection inherit again. */
  export let revertText = "Inherit";

  /** Specify the text of the button that saves the changes. */
  export let saveText = "Save changes";

  /** Specify the text of the button that discards the changes. */
  export let discardText = "Discard";

  /** @param {PermissionsMatrixRole} role */
  function defaultInheritedText(role) {
    return `Inherited from ${role.label}`;
  }

  /** @param {PermissionsMatrixRole} role */
  function defaultInheritsText(role) {
    return `Inherits from ${role.label}`;
  }

  /** @param {string} reason */
  function defaultLockedText(reason) {
    return reason ? `Locked: ${reason}` : "Locked";
  }

  /** @param {number} count */
  function defaultChangesText(count) {
    return count === 0
      ? "No changes"
      : `${count} ${count === 1 ? "change" : "changes"}`;
  }

  /** @param {number} count */
  function defaultSelectedText(count) {
    return `${count} cells selected`;
  }

  /** @param {PermissionsMatrixLevel} level */
  function defaultSetLevelText(level) {
    return `Set to ${level.label}`;
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Close from "../icons/Close.svelte";
  import Locked from "../icons/Locked.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { observeResize } from "../utils/shared-observer.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    applyEdits,
    cellKey,
    changedKeys,
    cloneValues,
    diffValues,
    fixedWindow,
    flattenPermissions,
    groupTarget,
    lockReason as resolveLock,
    moveCell,
    nextLevel,
    normalizeLevels,
    orderRoles,
    paintedIndexes,
    resolveMatrix,
    revealOffset,
    rollup,
    setLeafEdit,
    visibleNodes,
  } from "./permissions-matrix-utils.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const fallbackId = uniqueId("pm");
  const ROW_HEIGHTS = { compact: 24, short: 32, medium: 40, tall: 64 };

  /** @type {null | HTMLDivElement} */
  let gridRef = null;

  let scrollTop = 0;
  let scrollLeft = 0;
  let scrollStepY = 0;
  let scrollStepX = 0;
  let viewHeight = height;
  // The server has no viewport; this is a laptop, so the first window is a
  // full screen and hydration keeps it.
  let viewWidth = 1280;

  /** @type {{ row: number; col: number }} */
  let active = { row: 1, col: 1 };

  /** @type {null | { anchor: { row: number; col: number }; focus: { row: number; col: number } }} */
  let selection = null;

  /** @type {PermissionsMatrixValues} */
  let baseline = cloneValues(saved ?? value);
  let prevSaved = saved;
  let prevTransposed = transposed;

  /** @type {null | HTMLElement} */
  let tipAnchor = null;
  let tipText = "";
  let tipOpen = false;
  let tipHovered = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let tipTimer;

  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: baseId = id ?? fallbackId;
  $: levelList = normalizeLevels(levels);
  $: levelCount = levelList ? levelList.length : 2;
  $: tree = flattenPermissions(permissions);
  $: roleOrder = orderRoles(roles);
  $: collapsedSet = new Set(collapsedIds);
  $: visible = visibleNodes(tree.nodes, collapsedSet);
  $: resolved = resolveMatrix({
    roles,
    roleOrder,
    permissions: tree,
    values: value,
    levels: levelList,
  });

  $: if (saved !== prevSaved) {
    prevSaved = saved;
    if (saved !== undefined) baseline = cloneValues(saved);
  }
  $: changes = diffValues(baseline, value);
  $: changeSet = changedKeys(changes);

  $: rotated = headerLayout === "rotated";
  $: rowHeight =
    ROW_HEIGHTS[
      /** @type {keyof typeof ROW_HEIGHTS} */ (
        normalizeSize(size, DATA_TABLE_SIZE_ALIASES)
      )
    ] ?? 48;
  $: colWidth = columnWidth ?? (rotated ? Math.max(rowHeight, 40) : 112);
  $: headHeight = headerHeight ?? (rotated ? 128 : 64);

  $: roleItems = roles.map((role, index) => ({
    kind: "role",
    index,
    role,
    node: null,
    id: `${baseId}-r-${index}`,
    depth: roleOrder.depth[index],
    parent: roleOrder.parentIndex[index],
    expanded: false,
  }));
  $: nodeItems = visible.map((node) => ({
    kind: "node",
    index: -1,
    role: null,
    node,
    id: `${baseId}-p-${node.index}`,
    depth: node.depth,
    parent: -1,
    expanded: node.group && !collapsedSet.has(node.id),
  }));
  $: rowItems = transposed ? roleItems : nodeItems;
  $: colItems = transposed ? nodeItems : roleItems;
  // Grid index 0 is the header row and the label column.
  $: rowCount = rowItems.length + 1;
  $: colCount = colItems.length + 1;
  $: bodyHeight = (rowCount - 1) * rowHeight;
  $: totalWidth = labelWidth + (colCount - 1) * colWidth;

  $: ({ start: rowStart, end: rowEnd } = virtualize
    ? fixedWindow({
        offset: scrollTop,
        viewport: viewHeight - headHeight,
        size: rowHeight,
        count: rowCount - 1,
        overscan,
        delta: scrollStepY,
      })
    : { start: 0, end: rowCount - 1 });
  $: ({ start: colStart, end: colEnd } = virtualize
    ? fixedWindow({
        offset: scrollLeft,
        viewport: viewWidth - labelWidth,
        size: colWidth,
        count: colCount - 1,
        overscan,
        delta: scrollStepX,
      })
    : { start: 0, end: colCount - 1 });
  $: paintedRows = paintedIndexes(rowStart, rowEnd, active.row - 1);
  $: paintedCols = paintedIndexes(colStart, colEnd, active.col - 1);

  $: if (active.row >= rowCount || active.col >= colCount) {
    active = {
      row: Math.min(active.row, rowCount - 1),
      col: Math.min(active.col, colCount - 1),
    };
  }

  $: if (transposed !== prevTransposed) {
    prevTransposed = transposed;
    selection = null;
  }

  $: rect = selection
    ? {
        r1: Math.min(selection.anchor.row, selection.focus.row),
        r2: Math.max(selection.anchor.row, selection.focus.row),
        c1: Math.min(selection.anchor.col, selection.focus.col),
        c2: Math.max(selection.anchor.col, selection.focus.col),
      }
    : null;
  $: selectedCount = rect
    ? (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1)
    : 0;
  $: multiSelected = selectedCount > 1;

  $: ctx = {
    roles,
    roleOrder,
    tree,
    resolved,
    changed: changeSet,
    lockFn: lockReason,
    count: levelCount,
  };
  $: texts = {
    revoked: revokedText,
    mixed: mixedText,
    changed: changedText,
    inherited: inheritedText,
    locked: lockedText,
  };

  /**
   * What a cell shows. A leaf reads one resolved level; a group summarizes
   * its leaves.
   * @param {number} roleIndex
   * @param {import("./permissions-matrix-utils.js").PermissionNode} node
   * @param {typeof ctx} context
   */
  function cellInfo(roleIndex, node, context) {
    const role = context.roles[roleIndex];
    const { levels: effective, explicit, from } = context.resolved;
    const parent = context.roleOrder.parentIndex[roleIndex];
    const lockFn = context.lockFn;
    const own = resolveLock(role, node, lockFn);
    let lock = own;

    if (!node.group) {
      const leaf = node.leafStart;
      const level = effective[roleIndex][leaf];
      const entry = explicit[roleIndex][leaf];
      const inheritedLevel = parent >= 0 ? effective[parent][leaf] : 0;
      return {
        group: false,
        level,
        uniform: true,
        inherited: entry < 0 && from[roleIndex][leaf] >= 0,
        revoked: entry >= 0 && entry < inheritedLevel,
        source: from[roleIndex][leaf],
        changed: context.changed.has(cellKey(role.id, node.id)),
        lock,
      };
    }

    const { uniform, level } = rollup(
      effective[roleIndex],
      node.leafStart,
      node.leafEnd,
    );
    let ownCount = 0;
    let source = -1;
    let changed = false;
    let locked = 0;
    for (let leaf = node.leafStart; leaf < node.leafEnd; leaf++) {
      if (explicit[roleIndex][leaf] >= 0) ownCount++;
      else if (from[roleIndex][leaf] >= 0) source = from[roleIndex][leaf];
      const leafNode = context.tree.leaves[leaf];
      if (!changed && context.changed.has(cellKey(role.id, leafNode.id))) {
        changed = true;
      }
      const reason = resolveLock(role, leafNode, lockFn);
      if (reason !== null) {
        locked++;
        if (lock === null) lock = reason;
      }
    }
    return {
      group: true,
      level,
      uniform,
      inherited: uniform && level > 0 && ownCount === 0 && source >= 0,
      revoked: false,
      source,
      changed,
      lock:
        own === null
          ? locked === node.leafEnd - node.leafStart
            ? lock
            : null
          : own,
    };
  }

  /**
   * @param {ReturnType<typeof cellInfo>} info
   * @param {typeof texts} text
   * @param {ReadonlyArray<PermissionsMatrixRole>} roleList
   */
  function cellText(info, text, roleList) {
    /** @type {string[]} */
    const parts = [];
    if (info.revoked) parts.push(text.revoked);
    if (info.inherited) parts.push(text.inherited(roleList[info.source]));
    if (info.changed) parts.push(text.changed);
    if (info.lock !== null) parts.push(text.locked(info.lock));
    return parts.join(", ");
  }

  /**
   * @param {ReturnType<typeof cellInfo>} info
   * @returns {"true" | "false" | "mixed"}
   */
  function checkedState(info) {
    if (!info.uniform) return "mixed";
    return info.level > 0 ? "true" : "false";
  }

  /**
   * @param {number} row
   * @param {number} col
   * @param {null | { r1: number; r2: number; c1: number; c2: number }} box
   */
  function inRect(row, col, box) {
    return (
      box !== null &&
      row >= box.r1 &&
      row <= box.r2 &&
      col >= box.c1 &&
      col <= box.c2
    );
  }

  /**
   * @param {{ index: number }} rowItem
   * @param {{ index: number }} colItem
   * @param {boolean} flipped
   */
  function cellRole(rowItem, colItem, flipped) {
    return flipped ? rowItem.index : colItem.index;
  }

  /**
   * @param {{ node: import("./permissions-matrix-utils.js").PermissionNode | null }} rowItem
   * @param {{ node: import("./permissions-matrix-utils.js").PermissionNode | null }} colItem
   * @param {boolean} flipped
   */
  function cellNode(rowItem, colItem, flipped) {
    return /** @type {import("./permissions-matrix-utils.js").PermissionNode} */ (
      flipped ? colItem.node : rowItem.node
    );
  }

  /**
   * The role and permission at a body cell.
   * @param {number} row
   * @param {number} col
   */
  function pairAt(row, col) {
    const rowItem = rowItems[row - 1];
    const colItem = colItems[col - 1];
    if (!rowItem || !colItem) return null;
    return transposed
      ? {
          roleIndex: rowItem.index,
          node: /** @type {NonNullable<typeof colItem.node>} */ (colItem.node),
        }
      : {
          roleIndex: colItem.index,
          node: /** @type {NonNullable<typeof rowItem.node>} */ (rowItem.node),
        };
  }

  /**
   * The leaves of a pair a gesture may change.
   * @param {{ roleIndex: number; node: import("./permissions-matrix-utils.js").PermissionNode }} pair
   */
  function editableLeaves(pair) {
    const role = roles[pair.roleIndex];
    /** @type {number[]} */
    const leaves = [];
    if (resolveLock(role, pair.node, lockReason) !== null) return leaves;
    for (let leaf = pair.node.leafStart; leaf < pair.node.leafEnd; leaf++) {
      if (resolveLock(role, tree.leaves[leaf], lockReason) === null) {
        leaves.push(leaf);
      }
    }
    return leaves;
  }

  /**
   * @param {Array<{ roleIndex: number; node: import("./permissions-matrix-utils.js").PermissionNode }>} pairs
   * @param {number | "inherit"} target
   */
  function applyPairs(pairs, target) {
    /** @type {PermissionsMatrixEdit[]} */
    const edits = [];
    for (const pair of pairs) {
      const role = roles[pair.roleIndex];
      const parent = roleOrder.parentIndex[pair.roleIndex];
      const own = resolved.explicit[pair.roleIndex];
      for (const leaf of editableLeaves(pair)) {
        const inheritedLevel = parent >= 0 ? resolved.levels[parent][leaf] : 0;
        if (target === "inherit") {
          if (own[leaf] >= 0) {
            edits.push({
              roleId: role.id,
              permissionId: tree.leaves[leaf].id,
              value: undefined,
            });
          }
          continue;
        }
        const next = target === inheritedLevel ? -1 : target;
        if (next === own[leaf]) continue;
        edits.push(
          setLeafEdit({
            roleId: role.id,
            permissionId: tree.leaves[leaf].id,
            level: target,
            inheritedLevel,
            levels: levelList,
          }),
        );
      }
    }
    if (edits.length === 0) return;
    value = applyEdits(value, edits);
    dispatch("change", { value, edits });
  }

  /** The body cells a selection covers, as role and permission pairs. */
  function selectedPairs() {
    if (!rect) return [];
    /** @type {NonNullable<ReturnType<typeof pairAt>>[]} */
    const pairs = [];
    for (let row = Math.max(1, rect.r1); row <= rect.r2; row++) {
      for (let col = Math.max(1, rect.c1); col <= rect.c2; col++) {
        const pair = pairAt(row, col);
        if (pair) pairs.push(pair);
      }
    }
    return pairs;
  }

  /**
   * Step the cell at a position, and the selection with it.
   * @param {number} row
   * @param {number} col
   * @param {1 | -1} step
   */
  function stepCell(row, col, step) {
    const pair = pairAt(row, col);
    if (!pair) return;
    const leaves = editableLeaves(pair);
    if (leaves.length === 0) return;
    const levelsOfRole = resolved.levels[pair.roleIndex];
    const target = pair.node.group
      ? step === 1
        ? groupTarget(levelsOfRole, leaves, levelCount)
        : rollup(levelsOfRole, pair.node.leafStart, pair.node.leafEnd).uniform
          ? nextLevel(levelsOfRole[pair.node.leafStart], levelCount, -1)
          : 0
      : nextLevel(levelsOfRole[pair.node.leafStart], levelCount, step);
    const covered = inRect(row, col, rect) && multiSelected;
    applyPairs(covered ? selectedPairs() : [pair], target);
  }

  /** @param {number | "inherit"} target */
  function applyToSelection(target) {
    applyPairs(selectedPairs(), target);
  }

  /**
   * @param {import("./permissions-matrix-utils.js").PermissionNode} node
   */
  function toggleGroup(node) {
    collapsedIds = collapsedSet.has(node.id)
      ? collapsedIds.filter((collapsedId) => collapsedId !== node.id)
      : [...collapsedIds, node.id];
    selection = null;
  }

  /** @param {number} col */
  function selectColumn(col) {
    if (rowCount < 2) return;
    selection = {
      anchor: { row: 1, col },
      focus: { row: rowCount - 1, col },
    };
  }

  /** @param {number} row */
  function selectRow(row) {
    if (colCount < 2) return;
    selection = {
      anchor: { row, col: 1 },
      focus: { row, col: colCount - 1 },
    };
  }

  function selectAll() {
    if (rowCount < 2 || colCount < 2) return;
    selection = {
      anchor: { row: 1, col: 1 },
      focus: { row: rowCount - 1, col: colCount - 1 },
    };
  }

  /**
   * Activate a header: expand or collapse a group, else select its line.
   * @param {number} row
   * @param {number} col
   */
  function activateHeader(row, col) {
    if (row === 0 && col === 0) return selectAll();
    const item = row === 0 ? colItems[col - 1] : rowItems[row - 1];
    if (item?.node?.group) {
      toggleGroup(item.node);
    } else if (row === 0) {
      selectColumn(col);
    } else {
      selectRow(row);
    }
  }

  function handleSave() {
    if (!dispatch("save", { value, changes }, { cancelable: true })) return;
    baseline = cloneValues(value);
    saved = baseline;
    prevSaved = saved;
  }

  function handleDiscard() {
    value = cloneValues(baseline);
    selection = null;
    dispatch("discard", null);
  }

  /**
   * Bring a cell out from under the sticky header and label column.
   * @param {number} row
   * @param {number} col
   */
  function reveal(row, col) {
    if (!gridRef) return;
    if (row > 0) {
      const next = revealOffset({
        start: (row - 1) * rowHeight,
        size: rowHeight,
        offset: gridRef.scrollTop,
        viewport: gridRef.clientHeight - headHeight,
      });
      if (next !== gridRef.scrollTop) gridRef.scrollTop = next;
    }
    if (col > 0) {
      const sign =
        resolveLayoutDirection($layoutDirection, gridRef) === "rtl" ? -1 : 1;
      const current = Math.abs(gridRef.scrollLeft);
      const next = revealOffset({
        start: (col - 1) * colWidth,
        size: colWidth,
        offset: current,
        viewport: gridRef.clientWidth - labelWidth,
      });
      if (next !== current) gridRef.scrollLeft = sign * next;
    }
  }

  /**
   * Make a cell the tab stop and move focus to it.
   * @param {number} row
   * @param {number} col
   */
  async function focusCell(row, col) {
    active = { row, col };
    reveal(row, col);
    await tick();
    /** @type {HTMLElement | null | undefined} */
    const cell = gridRef?.querySelector(`[data-r="${row}"][data-c="${col}"]`);
    /** @type {HTMLElement | null | undefined} */
    const target = cell?.querySelector("[data-pm-focus]") ?? cell;
    target?.focus({ preventScroll: true });
  }

  /** @param {Event} event */
  function cellOf(event) {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const cell = target.closest("[data-pm]");
    return cell instanceof HTMLElement && gridRef?.contains(cell) ? cell : null;
  }

  /** @param {HTMLElement} cell */
  function positionOf(cell) {
    return { row: Number(cell.dataset.r), col: Number(cell.dataset.c) };
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    const cell = cellOf(event);
    if (!cell) return;
    const { row, col } = positionOf(cell);
    if (row > 0 && col > 0) {
      if (event.shiftKey && active.row > 0 && active.col > 0) {
        selection = {
          anchor: selection?.anchor ?? { ...active },
          focus: { row, col },
        };
        active = { row, col };
        return;
      }
      if (!(multiSelected && inRect(row, col, rect))) selection = null;
      stepCell(row, col, 1);
      focusCell(row, col);
      return;
    }
    active = { row, col };
    activateHeader(row, col);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const cell = cellOf(event);
    if (!cell || event.altKey) return;
    const { row, col } = positionOf(cell);
    const { key } = event;
    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && (key === "a" || key === "A")) {
      event.preventDefault();
      selectAll();
      return;
    }

    const target = moveCell({ row, col }, key, {
      rows: rowCount,
      cols: colCount,
      page: Math.max(1, Math.floor((viewHeight - headHeight) / rowHeight) - 1),
      ctrl,
      rtl: resolveLayoutDirection($layoutDirection, gridRef) === "rtl",
    });
    if (target) {
      event.preventDefault();
      if (
        event.shiftKey &&
        row > 0 &&
        col > 0 &&
        target.row > 0 &&
        target.col > 0
      ) {
        selection = {
          anchor: selection?.anchor ?? { row, col },
          focus: target,
        };
      } else {
        selection = null;
      }
      focusCell(target.row, target.col);
      return;
    }

    if (key === " " || key === "Enter") {
      event.preventDefault();
      if (row > 0 && col > 0) stepCell(row, col, event.shiftKey ? -1 : 1);
      else activateHeader(row, col);
    } else if (key === "Delete" || key === "Backspace") {
      if (row === 0 || col === 0) return;
      event.preventDefault();
      const pair = pairAt(row, col);
      if (!pair) return;
      applyPairs(
        multiSelected && inRect(row, col, rect) ? selectedPairs() : [pair],
        "inherit",
      );
    } else if (key === "Escape") {
      if (tipOpen) hideTip();
      if (selection) {
        selection = null;
      }
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const cell = cellOf(event);
    if (!cell) return;
    const { row, col } = positionOf(cell);
    if (row !== active.row || col !== active.col) active = { row, col };
    reveal(row, col);
    showTip(cell, false);
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !gridRef?.contains(next)) hideTip();
  }

  /** @param {MouseEvent} event */
  function handleMouseover(event) {
    const cell = cellOf(event);
    if (cell) showTip(cell, true);
    else scheduleHideTip();
  }

  function handleMouseleave() {
    scheduleHideTip();
  }

  /**
   * @param {HTMLElement} cell
   * @param {boolean} hovered
   */
  function showTip(cell, hovered) {
    clearTimeout(tipTimer);
    if (cell.dataset.lock === undefined) {
      if (hovered) scheduleHideTip();
      else hideTip();
      return;
    }
    tipAnchor = cell;
    tipText = lockedText(cell.dataset.lock);
    tipOpen = true;
    tipHovered = hovered;
  }

  function scheduleHideTip() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(hideTip, 120);
  }

  function hideTip() {
    clearTimeout(tipTimer);
    tipOpen = false;
  }

  function handleScroll() {
    if (!gridRef) return;
    const nextTop = gridRef.scrollTop;
    const nextLeft = Math.abs(gridRef.scrollLeft);
    scrollStepY = nextTop - scrollTop;
    scrollStepX = nextLeft - scrollLeft;
    scrollTop = nextTop;
    scrollLeft = nextLeft;
    if (tipOpen && tipHovered) hideTip();
  }

  onMount(() => {
    const element = gridRef;
    if (!element) return;
    const stop = observeResize(element, () => {
      if (element.clientHeight > 0) viewHeight = element.clientHeight;
      if (element.clientWidth > 0) viewWidth = element.clientWidth;
    });
    return () => {
      stop();
      clearTimeout(tipTimer);
    };
  });
</script>

<div
  {...rest}
  class:bx--permissions-matrix={true}
  class:bx--permissions-matrix--transposed={transposed}
  class:bx--permissions-matrix--rotated={rotated}
  style:--ccs-pm-height="{height}px"
  style:--ccs-pm-row="{rowHeight}px"
  style:--ccs-pm-column="{colWidth}px"
  style:--ccs-pm-label="{labelWidth}px"
  style:--ccs-pm-head="{headHeight}px"
>
  {#if labelText}
    <div
      id="{baseId}-label"
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
    >
      {labelText}
    </div>
  {/if}
  <div class:bx--permissions-matrix__bar={true}>
    <span class:bx--permissions-matrix__status={true} role="status">
      {multiSelected
        ? selectedText(selectedCount)
        : changesText(changes.length)}
    </span>
    <div class:bx--permissions-matrix__actions={true}>
      {#if multiSelected}
        {#if levelList}
          {#each levelList as level, index (level.id)}
            <Button
              kind="tertiary"
              size="small"
              on:click={() => applyToSelection(index)}
            >
              {setLevelText(level)}
            </Button>
          {/each}
        {:else}
          <Button
            kind="tertiary"
            size="small"
            on:click={() => applyToSelection(1)}
          >
            {grantText}
          </Button>
          <Button
            kind="tertiary"
            size="small"
            on:click={() => applyToSelection(0)}
          >
            {revokeText}
          </Button>
        {/if}
        <Button
          kind="ghost"
          size="small"
          on:click={() => applyToSelection("inherit")}
        >
          {revertText}
        </Button>
      {/if}
      {#if changes.length > 0}
        <Button kind="ghost" size="small" on:click={handleDiscard}>
          {discardText}
        </Button>
        <Button size="small" on:click={handleSave}>{saveText}</Button>
      {/if}
    </div>
  </div>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div
    bind:this={gridRef}
    role="grid"
    tabindex="-1"
    id={baseId}
    class:bx--permissions-matrix__grid={true}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ??
      (ariaLabel || !labelText ? undefined : `${baseId}-label`)}
    aria-describedby={ariaDescribedBy}
    aria-rowcount={rowCount}
    aria-colcount={colCount}
    aria-multiselectable="true"
    on:scroll={handleScroll}
    on:click={handleClick}
    on:keydown={handleKeydown}
    on:focusin={handleFocusin}
    on:focusout={handleFocusout}
    on:mouseover={handleMouseover}
    on:mouseleave={handleMouseleave}
  >
    <div
      role="rowgroup"
      class:bx--permissions-matrix__head={true}
      style:width="{totalWidth}px"
    >
      <div
        role="row"
        aria-rowindex="1"
        class:bx--permissions-matrix__row={true}
      >
        <div
          role="columnheader"
          aria-colindex="1"
          id="{baseId}-c-0-0"
          data-pm=""
          data-r="0"
          data-c="0"
          tabindex={active.row === 0 && active.col === 0 ? 0 : -1}
          class:bx--permissions-matrix__cell={true}
          class:bx--permissions-matrix__header={true}
          class:bx--permissions-matrix__header--column={true}
          class:bx--permissions-matrix__corner={true}
        >
          {transposed ? rolesText : permissionsText}
        </div>
        {#each paintedCols as painted (painted.index)}
          {@const col = painted.index + 1}
          {@const item = colItems[painted.index]}
          {#if item}
            {@const parentRole =
              item.kind === "role" && item.parent >= 0
                ? roles[item.parent]
                : null}
            <div
              role="columnheader"
              aria-colindex={col + 1}
              aria-expanded={item.node?.group
                ? item.expanded
                  ? "true"
                  : "false"
                : undefined}
              id="{baseId}-c-0-{col}"
              data-pm=""
              data-r="0"
              data-c={col}
              tabindex={active.row === 0 && active.col === col ? 0 : -1}
              title={item.role ? item.role.label : item.node?.label}
              class:bx--permissions-matrix__cell={true}
              class:bx--permissions-matrix__header={true}
              class:bx--permissions-matrix__header--column={true}
              class:bx--permissions-matrix__header--group={item.node?.group}
              class:bx--permissions-matrix__header--selected={rect !== null &&
                col >= rect.c1 &&
                col <= rect.c2 &&
                rect.r1 <= 1 &&
                rect.r2 >= rowCount - 1}
              style:margin-inline-start={painted.gap > 0
                ? `${painted.gap * colWidth}px`
                : undefined}
              style:--ccs-pm-depth={item.depth}
            >
              {#if item.node?.group}
                <span
                  class:bx--permissions-matrix__chevron={true}
                  class:bx--permissions-matrix__chevron--expanded={item.expanded}
                >
                  <ChevronRight size={16} />
                </span>
              {/if}
              <span id={item.id} class:bx--permissions-matrix__label={true}>
                {#if item.node && item.node.path.length > 1}
                  <span class:bx--visually-hidden={true}
                    >{item.node.path.slice(0, -1).join(", ")},
                  </span>
                {/if}
                {item.role ? item.role.label : item.node?.label}
              </span>
              {#if parentRole}
                <span class:bx--visually-hidden={true}
                  >{inheritsText(parentRole)}</span
                >
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
    <div
      role="rowgroup"
      class:bx--permissions-matrix__body={true}
      style:width="{totalWidth}px"
      style:height="{bodyHeight}px"
    >
      {#each paintedRows as paintedRow (paintedRow.index)}
        {@const row = paintedRow.index + 1}
        {@const rowItem = rowItems[paintedRow.index]}
        {#if rowItem}
          {@const parentRole =
            rowItem.kind === "role" && rowItem.parent >= 0
              ? roles[rowItem.parent]
              : null}
          <div
            role="row"
            aria-rowindex={row + 1}
            class:bx--permissions-matrix__row={true}
            class:bx--permissions-matrix__row--group={rowItem.node?.group}
            style:top="{paintedRow.index * rowHeight}px"
          >
            <div
              role="rowheader"
              aria-colindex="1"
              aria-expanded={rowItem.node?.group
                ? rowItem.expanded
                  ? "true"
                  : "false"
                : undefined}
              id="{baseId}-c-{row}-0"
              data-pm=""
              data-r={row}
              data-c="0"
              tabindex={active.row === row && active.col === 0 ? 0 : -1}
              title={rowItem.node?.label ?? rowItem.role?.label}
              class:bx--permissions-matrix__cell={true}
              class:bx--permissions-matrix__header={true}
              class:bx--permissions-matrix__header--row={true}
              class:bx--permissions-matrix__header--group={rowItem.node?.group}
              class:bx--permissions-matrix__header--selected={rect !== null &&
                row >= rect.r1 &&
                row <= rect.r2 &&
                rect.c1 <= 1 &&
                rect.c2 >= colCount - 1}
              style:--ccs-pm-depth={rowItem.depth}
            >
              {#if rowItem.node?.group}
                <span
                  class:bx--permissions-matrix__chevron={true}
                  class:bx--permissions-matrix__chevron--expanded={rowItem.expanded}
                >
                  <ChevronRight size={16} />
                </span>
              {/if}
              <span id={rowItem.id} class:bx--permissions-matrix__label={true}>
                {#if rowItem.node && rowItem.node.path.length > 1}
                  <span class:bx--visually-hidden={true}
                    >{rowItem.node.path.slice(0, -1).join(", ")},
                  </span>
                {/if}
                {rowItem.role ? rowItem.role.label : rowItem.node?.label}
              </span>
              {#if parentRole}
                <span class:bx--visually-hidden={true}
                  >{inheritsText(parentRole)}</span
                >
              {/if}
            </div>
            {#each paintedCols as painted (painted.index)}
              {@const col = painted.index + 1}
              {@const colItem = colItems[painted.index]}
              {#if colItem}
                {@const info = cellInfo(
                  cellRole(rowItem, colItem, transposed),
                  cellNode(rowItem, colItem, transposed),
                  ctx,
                )}
                {@const cellId = `${baseId}-c-${row}-${col}`}
                {@const stateText = cellText(info, texts, roles)}
                <!-- A boolean cell's checkbox takes focus, since `aria-checked`
                     is not allowed on a `gridcell`. A level cell takes focus
                     itself and reads its level from its text. -->
                <div
                  role="gridcell"
                  aria-colindex={col + 1}
                  aria-labelledby={levelList
                    ? `${rowItem.id} ${colItem.id} ${cellId}-level`
                    : undefined}
                  aria-describedby={levelList && stateText
                    ? `${cellId}-state`
                    : undefined}
                  aria-readonly={levelList && info.lock !== null
                    ? "true"
                    : undefined}
                  aria-selected={multiSelected
                    ? inRect(row, col, rect)
                      ? "true"
                      : "false"
                    : undefined}
                  id={cellId}
                  data-pm=""
                  data-r={row}
                  data-c={col}
                  data-lock={info.lock ?? undefined}
                  tabindex={levelList
                    ? active.row === row && active.col === col
                      ? 0
                      : -1
                    : undefined}
                  class:bx--permissions-matrix__cell={true}
                  class:bx--permissions-matrix__cell--group={info.group}
                  class:bx--permissions-matrix__cell--granted={info.uniform &&
                    info.level > 0}
                  class:bx--permissions-matrix__cell--mixed={!info.uniform}
                  class:bx--permissions-matrix__cell--inherited={info.inherited}
                  class:bx--permissions-matrix__cell--revoked={info.revoked}
                  class:bx--permissions-matrix__cell--changed={info.changed}
                  class:bx--permissions-matrix__cell--locked={info.lock !==
                    null}
                  class:bx--permissions-matrix__cell--selected={multiSelected &&
                    inRect(row, col, rect)}
                  style:margin-inline-start={painted.gap > 0
                    ? `${painted.gap * colWidth}px`
                    : undefined}
                >
                  {#if levelList}
                    <span
                      id="{cellId}-level"
                      class:bx--permissions-matrix__level={true}
                      class:bx--permissions-matrix__level--none={info.uniform &&
                        info.level === 0}
                    >
                      {info.uniform ? levelList[info.level].label : mixedText}
                    </span>
                  {:else}
                    <span
                      role="checkbox"
                      aria-checked={checkedState(info)}
                      aria-labelledby="{rowItem.id} {colItem.id}"
                      aria-describedby={stateText
                        ? `${cellId}-state`
                        : undefined}
                      aria-readonly={info.lock === null ? undefined : "true"}
                      tabindex={active.row === row && active.col === col
                        ? 0
                        : -1}
                      data-pm-focus=""
                      class:bx--permissions-matrix__box={true}
                    >
                      {#if !info.uniform}
                        <Subtract size={16} />
                      {:else if info.level > 0}
                        <Checkmark size={16} />
                      {:else if info.revoked}
                        <Close size={16} />
                      {/if}
                    </span>
                  {/if}
                  {#if info.lock !== null}
                    <Locked size={12} class="bx--permissions-matrix__lock" />
                  {/if}
                  {#if stateText}
                    <span id="{cellId}-state" class:bx--visually-hidden={true}
                      >{stateText}</span
                    >
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <PortalTooltip
    anchor={tipAnchor}
    open={tipOpen}
    text={tipText}
    direction="top"
    tooltipType="icon"
    on:mouseenter={() => clearTimeout(tipTimer)}
    on:mouseleave={scheduleHideTip}
    on:cover={hideTip}
  />
</div>
