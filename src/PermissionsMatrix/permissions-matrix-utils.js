// @ts-check

/**
 * Pure model functions for `PermissionsMatrix`: role inheritance, group
 * rollup, the diff against a saved state, grid movement and the painted
 * window. No DOM and no Svelte, so each is tested on its own.
 *
 * Values are held per role and permission id, as the consumer gives them:
 * `values[roleId][permissionId]`, a boolean or a level id. A missing entry
 * means "not set here": the role inherits its parent's value, or takes the
 * lowest level. Internally every value is a level index, `0` through
 * `count - 1`; a boolean matrix has two levels.
 */

/**
 * @typedef {object} PermissionsMatrixLevel
 * @property {string} id
 * @property {string} label
 */

/** @typedef {boolean | string} PermissionsMatrixValue */

/** @typedef {Record<string, Record<string, PermissionsMatrixValue>>} PermissionsMatrixValues */

/**
 * @typedef {object} PermissionsMatrixRole
 * @property {string} id
 * @property {string} label
 * @property {string | null} [parent] Id of the role this one inherits from.
 * @property {boolean | string} [locked] `true`, or the reason, to make every cell of the role read only.
 */

/**
 * @typedef {object} PermissionsMatrixPermission
 * @property {string} id
 * @property {string} label
 * @property {PermissionsMatrixPermission[]} [children]
 * @property {boolean | string} [locked] `true`, or the reason, to make every cell of the permission read only.
 */

/**
 * @typedef {object} PermissionNode
 * @property {string} id
 * @property {string} label
 * @property {number} index Position in `nodes`, stable while groups collapse.
 * @property {number} depth Zero for a top-level node.
 * @property {string | null} parentId
 * @property {boolean} group `true` for a node with children.
 * @property {number} leafStart Index of the node's first leaf in `leaves`.
 * @property {number} leafEnd One past the node's last leaf. A leaf covers itself.
 * @property {number} end One past the node's last descendant in `nodes`.
 * @property {string[]} path Labels from the top-level ancestor to the node.
 * @property {string[]} pathIds Ids of the same.
 * @property {number[]} pathIndexes `index` of the same.
 * @property {boolean | string | undefined} locked
 * @property {PermissionsMatrixPermission} item The consumer's object.
 */

/**
 * @typedef {object} FlatPermissions
 * @property {PermissionNode[]} nodes Every node in tree order.
 * @property {PermissionNode[]} leaves The nodes without children, in tree order.
 * @property {Map<string, number>} leafIndexById
 */

/**
 * Normalize the `levels` prop. Fewer than two levels is a boolean matrix.
 *
 * @param {ReadonlyArray<string | PermissionsMatrixLevel> | null | undefined} levels
 * @returns {PermissionsMatrixLevel[] | null}
 */
export function normalizeLevels(levels) {
  if (!levels || levels.length < 2) return null;
  return levels.map((level) =>
    typeof level === "string" ? { id: level, label: level } : level,
  );
}

/**
 * The level index of a value, or `-1` when it is unset or unknown.
 *
 * @param {PermissionsMatrixValue | null | undefined} value
 * @param {PermissionsMatrixLevel[] | null} levels
 * @returns {number}
 */
export function toLevelIndex(value, levels) {
  if (value === undefined || value === null) return -1;
  if (!levels) return value === true ? 1 : value === false ? 0 : -1;
  return levels.findIndex((level) => level.id === value);
}

/**
 * The value a level index is stored as.
 *
 * @param {number} index
 * @param {PermissionsMatrixLevel[] | null} levels
 * @returns {PermissionsMatrixValue}
 */
export function fromLevelIndex(index, levels) {
  return levels ? levels[index].id : index === 1;
}

/**
 * Flatten the permission tree. A node with `children` is a group, and its
 * leaves are contiguous in `leaves`, so a rollup is a range scan.
 *
 * @param {ReadonlyArray<PermissionsMatrixPermission>} permissions
 * @returns {FlatPermissions}
 */
export function flattenPermissions(permissions) {
  /** @type {PermissionNode[]} */
  const nodes = [];
  /** @type {PermissionNode[]} */
  const leaves = [];
  /** @type {Map<string, number>} */
  const leafIndexById = new Map();

  /**
   * @param {ReadonlyArray<PermissionsMatrixPermission>} list
   * @param {number} depth
   * @param {PermissionNode | null} parent
   */
  function walk(list, depth, parent) {
    for (const item of list) {
      const children = item.children ?? [];
      const group = children.length > 0;
      /** @type {PermissionNode} */
      const node = {
        id: item.id,
        label: item.label,
        index: nodes.length,
        depth,
        parentId: parent ? parent.id : null,
        group,
        leafStart: leaves.length,
        leafEnd: leaves.length,
        end: 0,
        path: parent ? [...parent.path, item.label] : [item.label],
        pathIds: parent ? [...parent.pathIds, item.id] : [item.id],
        pathIndexes: parent
          ? [...parent.pathIndexes, nodes.length]
          : [nodes.length],
        locked: item.locked ?? parent?.locked,
        item,
      };
      nodes.push(node);
      if (group) {
        walk(children, depth + 1, node);
      } else {
        leafIndexById.set(item.id, leaves.length);
        leaves.push(node);
      }
      node.leafEnd = leaves.length;
      node.end = nodes.length;
    }
  }

  walk(permissions, 0, null);
  return { nodes, leaves, leafIndexById };
}

/**
 * The nodes that show: every node whose ancestors are all expanded, in tree
 * order.
 *
 * @param {PermissionNode[]} nodes
 * @param {ReadonlySet<string>} collapsed Ids of collapsed groups.
 * @returns {PermissionNode[]}
 */
export function visibleNodes(nodes, collapsed) {
  if (collapsed.size === 0) return nodes;
  /** @type {PermissionNode[]} */
  const visible = [];
  for (let i = 0; i < nodes.length;) {
    const node = nodes[i];
    visible.push(node);
    i = node.group && collapsed.has(node.id) ? node.end : i + 1;
  }
  return visible;
}

/**
 * @typedef {object} RoleOrder
 * @property {number[]} parentIndex Index of each role's parent in `roles`, or `-1`.
 * @property {number[]} order Role indexes, every parent before its children.
 * @property {number[]} depth Inheritance depth, zero for a role with no parent.
 * @property {string[]} cyclic Ids of roles whose parent was dropped to break a cycle. They resolve as roots.
 */

/**
 * Order roles for inheritance. A parent that is unknown, or that would make
 * a cycle, is ignored, so the role resolves as a root rather than loop.
 *
 * @param {ReadonlyArray<PermissionsMatrixRole>} roles
 * @returns {RoleOrder}
 */
export function orderRoles(roles) {
  /** @type {Map<string, number>} */
  const indexById = new Map();
  roles.forEach((role, i) => {
    indexById.set(role.id, i);
  });
  const parentIndex = roles.map((role) =>
    role.parent != null && role.parent !== role.id
      ? (indexById.get(role.parent) ?? -1)
      : -1,
  );

  // 0 unvisited, 1 on the current walk, 2 done.
  const state = new Uint8Array(roles.length);
  /** @type {number[]} */
  const depth = new Array(roles.length).fill(0);
  /** @type {string[]} */
  const cyclic = [];
  /** @type {number[]} */
  const order = [];

  for (let start = 0; start < roles.length; start++) {
    if (state[start] === 2) continue;
    /** @type {number[]} */
    const chain = [];
    let i = start;
    while (i !== -1 && state[i] === 0) {
      state[i] = 1;
      chain.push(i);
      i = parentIndex[i];
    }
    if (i !== -1 && state[i] === 1) {
      // The walk met itself: the last role on it points back into the
      // chain, so that link is the one to cut.
      const last = chain[chain.length - 1];
      cyclic.push(roles[last].id);
      parentIndex[last] = -1;
    }
    for (let k = chain.length - 1; k >= 0; k--) {
      const role = chain[k];
      const parent = parentIndex[role];
      depth[role] = parent === -1 ? 0 : depth[parent] + 1;
      state[role] = 2;
      order.push(role);
    }
  }

  return { parentIndex, order, depth, cyclic };
}

/**
 * @typedef {object} ResolvedMatrix
 * @property {Int8Array[]} levels Effective level index per role, per leaf.
 * @property {Int16Array[]} from The role index the level comes from: the role itself for an explicit value, an ancestor for an inherited one, `-1` for the default.
 * @property {Int8Array[]} explicit The role's own level index per leaf, `-1` when unset.
 */

/**
 * Resolve every role's effective value for every leaf. A role's own entry
 * wins; otherwise it takes its parent's effective value, and a root takes
 * the lowest level.
 *
 * @param {object} options
 * @param {ReadonlyArray<PermissionsMatrixRole>} options.roles
 * @param {RoleOrder} options.roleOrder
 * @param {FlatPermissions} options.permissions
 * @param {PermissionsMatrixValues | null | undefined} options.values
 * @param {PermissionsMatrixLevel[] | null} options.levels
 * @returns {ResolvedMatrix}
 */
export function resolveMatrix({
  roles,
  roleOrder,
  permissions,
  values,
  levels,
}) {
  const leafCount = permissions.leaves.length;
  /** @type {Int8Array[]} */
  const effective = new Array(roles.length);
  /** @type {Int16Array[]} */
  const from = new Array(roles.length);
  /** @type {Int8Array[]} */
  const explicit = new Array(roles.length);

  for (const i of roleOrder.order) {
    const parent = roleOrder.parentIndex[i];
    const level = new Int8Array(leafCount);
    const source = new Int16Array(leafCount);
    const own = new Int8Array(leafCount).fill(-1);
    if (parent === -1) {
      source.fill(-1);
    } else {
      level.set(effective[parent]);
      source.set(from[parent]);
    }
    const entries = values?.[roles[i].id];
    if (entries) {
      for (const key of Object.keys(entries)) {
        const leaf = permissions.leafIndexById.get(key);
        if (leaf === undefined) continue;
        const index = toLevelIndex(entries[key], levels);
        if (index < 0) continue;
        own[leaf] = index;
        level[leaf] = index;
        source[leaf] = i;
      }
    }
    effective[i] = level;
    from[i] = source;
    explicit[i] = own;
  }

  return { levels: effective, from, explicit };
}

/**
 * Summarize leaves `start` to `end` of one role's levels. `uniform` is
 * `true` when they share a level, which is then `level`; otherwise the
 * group is "mixed" and `level` is `-1`. An empty range is uniform at the
 * lowest level.
 *
 * @param {Int8Array} levels
 * @param {number} start
 * @param {number} end
 * @returns {{ uniform: boolean; level: number }}
 */
export function rollup(levels, start, end) {
  if (end <= start) return { uniform: true, level: 0 };
  const first = levels[start];
  for (let i = start + 1; i < end; i++) {
    if (levels[i] !== first) return { uniform: false, level: -1 };
  }
  return { uniform: true, level: first };
}

/**
 * The next level in a cycle, wrapping at either end.
 *
 * @param {number} current
 * @param {number} count Number of levels.
 * @param {1 | -1} [step]
 * @returns {number}
 */
export function nextLevel(current, count, step = 1) {
  return (((current + step) % count) + count) % count;
}

/**
 * The level a group toggle sets, from the leaves the toggle may change. Like
 * a tri-state checkbox: a mixed group becomes the highest level, a uniform
 * one steps to the next level and wraps. A boolean group is granted unless
 * every editable leaf already is.
 *
 * @param {Int8Array} levels
 * @param {number[]} leaves Indexes of the leaves that may change.
 * @param {number} count
 * @returns {number}
 */
export function groupTarget(levels, leaves, count) {
  if (leaves.length === 0) return count - 1;
  const first = levels[leaves[0]];
  for (let i = 1; i < leaves.length; i++) {
    if (levels[leaves[i]] !== first) return count - 1;
  }
  return nextLevel(first, count);
}

/**
 * The reason a cell is read only, `""` for a lock with no reason, or `null`
 * when it can change. A permission's lock wins over a role's, then the
 * consumer's callback. Given a `PermissionNode`, the callback gets the
 * consumer's own object, and a group's lock reaches its children.
 *
 * @param {PermissionsMatrixRole} role
 * @param {{ id: string; label: string; locked?: boolean | string; item?: PermissionsMatrixPermission }} permission
 * @param {((role: PermissionsMatrixRole, permission: PermissionsMatrixPermission) => boolean | string | null | undefined) | undefined} callback
 * @returns {string | null}
 */
export function lockReason(role, permission, callback) {
  const found =
    permission.locked ||
    role.locked ||
    callback?.(role, permission.item ?? permission);
  if (!found) return null;
  return typeof found === "string" ? found : "";
}

/**
 * @typedef {object} CellEdit
 * @property {string} roleId
 * @property {string} permissionId
 * @property {PermissionsMatrixValue | undefined} value `undefined` removes the role's own entry.
 */

/**
 * Apply edits without touching the input. Roles that no edit touches keep
 * their identity, and a role left with no entries is dropped.
 *
 * @param {PermissionsMatrixValues} values
 * @param {ReadonlyArray<CellEdit>} edits
 * @returns {PermissionsMatrixValues}
 */
export function applyEdits(values, edits) {
  if (edits.length === 0) return values;
  /** @type {PermissionsMatrixValues} */
  const next = { ...values };
  /** @type {Set<string>} */
  const copied = new Set();
  for (const { roleId, permissionId, value } of edits) {
    if (!copied.has(roleId)) {
      next[roleId] = { ...next[roleId] };
      copied.add(roleId);
    }
    if (value === undefined) delete next[roleId][permissionId];
    else next[roleId][permissionId] = value;
  }
  for (const roleId of copied) {
    if (Object.keys(next[roleId]).length === 0) delete next[roleId];
  }
  return next;
}

/**
 * The edit that sets one leaf of one role to a level. A level equal to what
 * the role would take with no entry removes its entry instead, so flipping
 * a cell and flipping it back leaves it as it was, inherited or not.
 *
 * @param {object} options
 * @param {string} options.roleId
 * @param {string} options.permissionId
 * @param {number} options.level
 * @param {number} options.inheritedLevel What the role takes with no entry: its parent's level, or `0`.
 * @param {PermissionsMatrixLevel[] | null} options.levels
 * @returns {CellEdit}
 */
export function setLeafEdit({
  roleId,
  permissionId,
  level,
  inheritedLevel,
  levels,
}) {
  return {
    roleId,
    permissionId,
    value: level === inheritedLevel ? undefined : fromLevelIndex(level, levels),
  };
}

/**
 * @typedef {object} MatrixChange
 * @property {string} roleId
 * @property {string} permissionId
 * @property {PermissionsMatrixValue | undefined} from The saved value, `undefined` when the role had none.
 * @property {PermissionsMatrixValue | undefined} to The current value.
 */

/**
 * Compare the matrix with its saved state, entry by entry.
 *
 * @param {PermissionsMatrixValues | null | undefined} saved
 * @param {PermissionsMatrixValues | null | undefined} current
 * @returns {MatrixChange[]}
 */
export function diffValues(saved, current) {
  /** @type {MatrixChange[]} */
  const changes = [];
  const before = saved ?? {};
  const after = current ?? {};
  if (before === after) return changes;
  const roleIds = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const roleId of roleIds) {
    const a = before[roleId];
    const b = after[roleId];
    if (a === b) continue;
    const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
    for (const permissionId of keys) {
      const from = a?.[permissionId];
      const to = b?.[permissionId];
      if (from !== to) changes.push({ roleId, permissionId, from, to });
    }
  }
  return changes;
}

/**
 * The key `changedKeys` holds for a cell.
 *
 * @param {string} roleId
 * @param {string} permissionId
 */
export function cellKey(roleId, permissionId) {
  return `${roleId}\u0000${permissionId}`;
}

/**
 * @param {ReadonlyArray<MatrixChange>} changes
 * @returns {Set<string>}
 */
export function changedKeys(changes) {
  return new Set(changes.map((c) => cellKey(c.roleId, c.permissionId)));
}

/**
 * @typedef {object} GridPosition
 * @property {number} row
 * @property {number} col
 */

/**
 * Where a navigation key moves. Grid index `0` is the header row or the
 * label column. Returns `null` for a key that does not move. `ArrowLeft`
 * and `ArrowRight` are the physical keys; `rtl` swaps them.
 *
 * @param {GridPosition} from
 * @param {string} key
 * @param {object} options
 * @param {number} options.rows Rows in the grid, header included.
 * @param {number} options.cols Columns in the grid, label column included.
 * @param {number} options.page Rows a page key moves.
 * @param {boolean} [options.ctrl] Ctrl or Cmd is held.
 * @param {boolean} [options.rtl]
 * @returns {GridPosition | null}
 */
export function moveCell(
  from,
  key,
  { rows, cols, page, ctrl = false, rtl = false },
) {
  const lastRow = rows - 1;
  const lastCol = cols - 1;
  const clampRow = (/** @type {number} */ r) =>
    Math.max(0, Math.min(lastRow, r));
  const clampCol = (/** @type {number} */ c) =>
    Math.max(0, Math.min(lastCol, c));
  let { row, col } = from;
  switch (key) {
    case "ArrowDown":
      row = ctrl ? lastRow : clampRow(row + 1);
      break;
    case "ArrowUp":
      row = ctrl ? 0 : clampRow(row - 1);
      break;
    case "ArrowRight":
      col = ctrl ? (rtl ? 0 : lastCol) : clampCol(col + (rtl ? -1 : 1));
      break;
    case "ArrowLeft":
      col = ctrl ? (rtl ? lastCol : 0) : clampCol(col + (rtl ? 1 : -1));
      break;
    case "Home":
      if (ctrl) row = 0;
      col = 0;
      break;
    case "End":
      if (ctrl) row = lastRow;
      col = lastCol;
      break;
    case "PageDown":
      row = clampRow(row + page);
      break;
    case "PageUp":
      row = clampRow(row - page);
      break;
    default:
      return null;
  }
  return { row, col };
}

/**
 * The indexes of items along one axis to paint: the ones the viewport
 * reaches, plus `overscan` either side. Items are a fixed `size` apart.
 * The browser paints a scroll on the compositor before the component sees
 * it, so a window that covers only the viewport shows blank space when one
 * frame moves farther than `overscan`. `delta`, the last scroll step, grows
 * the side the scroll is heading for by two steps more.
 *
 * @param {object} options
 * @param {number} options.offset Scroll offset, from the start of the first item.
 * @param {number} options.viewport Visible length.
 * @param {number} options.size Length of one item.
 * @param {number} options.count Number of items.
 * @param {number} [options.overscan]
 * @param {number} [options.delta] The last change of `offset`; its sign is the direction of travel.
 * @returns {{ start: number; end: number }} `end` is exclusive.
 */
export function fixedWindow({
  offset,
  viewport,
  size,
  count,
  overscan = 3,
  delta = 0,
}) {
  if (count <= 0 || size <= 0) return { start: 0, end: 0 };
  const from = Math.max(0, offset);
  const first = Math.floor(from / size);
  const last = Math.ceil((from + Math.max(0, viewport)) / size);
  const lead = Math.min(40, Math.ceil(Math.abs(delta) / size) * 2);
  return {
    start: Math.max(
      0,
      Math.min(count - 1, first - overscan - (delta < 0 ? lead : 0)),
    ),
    end: Math.max(0, Math.min(count, last + overscan + (delta > 0 ? lead : 0))),
  };
}

/**
 * The scroll offset that brings an item fully into view, or the current one
 * when it already is.
 *
 * @param {object} options
 * @param {number} options.start Offset of the item from the start of the first item.
 * @param {number} options.size Length of the item.
 * @param {number} options.offset Current scroll offset.
 * @param {number} options.viewport Visible length, without the sticky headers.
 * @returns {number}
 */
export function revealOffset({ start, size, offset, viewport }) {
  if (start < offset) return start;
  if (start + size > offset + viewport) return start + size - viewport;
  return offset;
}

/**
 * Indexes to paint along one axis: the window, and the active item so the
 * tab stop never unmounts. In order, with the number of skipped items
 * before each.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} active Index of the active item, or `-1`.
 * @returns {Array<{ index: number; gap: number }>}
 */
export function paintedIndexes(start, end, active) {
  /** @type {Array<{ index: number; gap: number }>} */
  const painted = [];
  let previous = -1;
  /** @param {number} index */
  function add(index) {
    painted.push({ index, gap: index - previous - 1 });
    previous = index;
  }
  const outside = active >= 0 && (active < start || active >= end);
  if (outside && active < start) add(active);
  for (let i = start; i < end; i++) add(i);
  if (outside && active >= end) add(active);
  return painted;
}

/**
 * A copy of the values, so a snapshot survives edits made in place.
 *
 * @param {PermissionsMatrixValues | null | undefined} values
 * @returns {PermissionsMatrixValues}
 */
export function cloneValues(values) {
  /** @type {PermissionsMatrixValues} */
  const copy = {};
  for (const roleId of Object.keys(values ?? {})) {
    copy[roleId] = {
      .../** @type {PermissionsMatrixValues} */ (values)[roleId],
    };
  }
  return copy;
}
