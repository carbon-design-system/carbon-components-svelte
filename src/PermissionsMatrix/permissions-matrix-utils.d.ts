/**
 * Pure model functions for `PermissionsMatrix`: role inheritance, group
 * rollup, the diff against a saved state, grid movement and the painted
 * window.
 */

export interface PermissionsMatrixLevel {
  id: string;
  label: string;
}

export type PermissionsMatrixValue = boolean | string;

export type PermissionsMatrixValues = Record<
  string,
  Record<string, PermissionsMatrixValue>
>;

export interface PermissionsMatrixRole {
  id: string;
  label: string;
  /** Id of the role this one inherits from. */
  parent?: string | null;
  /** `true`, or the reason, to make every cell of the role read only. */
  locked?: boolean | string;
}

export interface PermissionsMatrixPermission {
  id: string;
  label: string;
  children?: PermissionsMatrixPermission[];
  /** `true`, or the reason, to make every cell of the permission read only. */
  locked?: boolean | string;
}

export interface PermissionNode {
  id: string;
  label: string;
  /** Position in `nodes`, stable while groups collapse. */
  index: number;
  /** Zero for a top-level node. */
  depth: number;
  parentId: string | null;
  /** `true` for a node with children. */
  group: boolean;
  /** Index of the node's first leaf in `leaves`. */
  leafStart: number;
  /** One past the node's last leaf. A leaf covers itself. */
  leafEnd: number;
  /** One past the node's last descendant in `nodes`. */
  end: number;
  /** Labels from the top-level ancestor to the node. */
  path: string[];
  /** Ids of the same. */
  pathIds: string[];
  /** `index` of the same. */
  pathIndexes: number[];
  locked: boolean | string | undefined;
  /** The consumer's object. */
  item: PermissionsMatrixPermission;
}

export interface FlatPermissions {
  nodes: PermissionNode[];
  leaves: PermissionNode[];
  leafIndexById: Map<string, number>;
}

export interface RoleOrder {
  parentIndex: number[];
  order: number[];
  depth: number[];
  cyclic: string[];
}

export interface ResolvedMatrix {
  levels: Int8Array[];
  from: Int16Array[];
  explicit: Int8Array[];
}

export interface CellEdit {
  roleId: string;
  permissionId: string;
  /** `undefined` removes the role's own entry. */
  value: PermissionsMatrixValue | undefined;
}

export interface MatrixChange {
  roleId: string;
  permissionId: string;
  from: PermissionsMatrixValue | undefined;
  to: PermissionsMatrixValue | undefined;
}

export interface GridPosition {
  row: number;
  col: number;
}

/** Fewer than two levels is a boolean matrix. */
export function normalizeLevels(
  levels: ReadonlyArray<string | PermissionsMatrixLevel> | null | undefined,
): PermissionsMatrixLevel[] | null;

/** The level index of a value, or `-1` when it is unset or unknown. */
export function toLevelIndex(
  value: PermissionsMatrixValue | null | undefined,
  levels: PermissionsMatrixLevel[] | null,
): number;

export function fromLevelIndex(
  index: number,
  levels: PermissionsMatrixLevel[] | null,
): PermissionsMatrixValue;

export function flattenPermissions(
  permissions: ReadonlyArray<PermissionsMatrixPermission>,
): FlatPermissions;

export function visibleNodes(
  nodes: PermissionNode[],
  collapsed: ReadonlySet<string>,
): PermissionNode[];

export function orderRoles(
  roles: ReadonlyArray<PermissionsMatrixRole>,
): RoleOrder;

export function resolveMatrix(options: {
  roles: ReadonlyArray<PermissionsMatrixRole>;
  roleOrder: RoleOrder;
  permissions: FlatPermissions;
  values: PermissionsMatrixValues | null | undefined;
  levels: PermissionsMatrixLevel[] | null;
}): ResolvedMatrix;

export function rollup(
  levels: Int8Array,
  start: number,
  end: number,
): { uniform: boolean; level: number };

export function nextLevel(
  current: number,
  count: number,
  step?: 1 | -1,
): number;

export function groupTarget(
  levels: Int8Array,
  leaves: number[],
  count: number,
): number;

export function lockReason(
  role: PermissionsMatrixRole,
  permission: {
    id: string;
    label: string;
    locked?: boolean | string;
    item?: PermissionsMatrixPermission;
  },
  callback:
    | ((
        role: PermissionsMatrixRole,
        permission: PermissionsMatrixPermission,
      ) => boolean | string | null | undefined)
    | undefined,
): string | null;

export function applyEdits(
  values: PermissionsMatrixValues,
  edits: ReadonlyArray<CellEdit>,
): PermissionsMatrixValues;

export function setLeafEdit(options: {
  roleId: string;
  permissionId: string;
  level: number;
  inheritedLevel: number;
  levels: PermissionsMatrixLevel[] | null;
}): CellEdit;

export function diffValues(
  saved: PermissionsMatrixValues | null | undefined,
  current: PermissionsMatrixValues | null | undefined,
): MatrixChange[];

export function cellKey(roleId: string, permissionId: string): string;

export function changedKeys(changes: ReadonlyArray<MatrixChange>): Set<string>;

export function moveCell(
  from: GridPosition,
  key: string,
  options: {
    rows: number;
    cols: number;
    page: number;
    ctrl?: boolean;
    rtl?: boolean;
  },
): GridPosition | null;

export function fixedWindow(options: {
  offset: number;
  viewport: number;
  size: number;
  count: number;
  overscan?: number;
  /** The last change of `offset`; its sign is the direction of travel. */
  delta?: number;
}): { start: number; end: number };

export function revealOffset(options: {
  start: number;
  size: number;
  offset: number;
  viewport: number;
}): number;

export function paintedIndexes(
  start: number,
  end: number,
  active: number,
): Array<{ index: number; gap: number }>;

/** A copy of the values, so a snapshot survives edits made in place. */
export function cloneValues(
  values: PermissionsMatrixValues | null | undefined,
): PermissionsMatrixValues;
