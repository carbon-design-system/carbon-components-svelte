type TreeFingerprintNode = {
  id: string | number;
  nodes?: TreeFingerprintNode[];
  [key: string]: unknown;
};

type TreeFingerprint = {
  id: string | number;
  keys: Record<string, unknown>;
  children: TreeFingerprint[];
};

/** Cheap per-node snapshot of a tree (shallow, `Object.is`-compared fields). */
export function fingerprintTree<T extends TreeFingerprintNode>(
  list: readonly T[],
): TreeFingerprint[];

/** Whether `list` still matches a snapshot taken by `fingerprintTree`. */
export function matchesFingerprint<T extends TreeFingerprintNode>(
  fingerprint: TreeFingerprint[],
  list: readonly T[],
): boolean;
