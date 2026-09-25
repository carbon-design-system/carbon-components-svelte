// @ts-check
/**
 * @typedef {string | number} TreeFingerprintNodeId
 */

/**
 * @typedef {Object} TreeFingerprintNode
 * @property {TreeFingerprintNodeId} id
 * @property {TreeFingerprintNode[]} [nodes]
 */

/**
 * @typedef {Object} TreeFingerprint
 * @property {TreeFingerprintNodeId} id
 * @property {Record<string, unknown>} keys
 * @property {TreeFingerprint[]} children
 */

/**
 * Cheap per-node snapshot of a tree, recorded whenever a tree reference
 * is accepted as changed for a genuine reason. Compared back against
 * the live tree only when a new `nodes` value is the SAME reference as
 * before (the lazy-load / in-place-mutation idiom, `node.nodes =
 * children; nodes = nodes`): diffing that reference against itself with
 * a same-vs-different object walk always reports "equal" (it can only
 * bail out on `prev === next`, since a shared node object may have been
 * mutated). A snapshot lets the caller tell "reassigned, nothing
 * touched" (a wrapper forwarding `nodes`, or a `$:` that re-runs for an
 * unrelated reason and yields the same array) apart from "reassigned
 * after a real in-place mutation".
 *
 * Shallow: fields are compared with `Object.is`, so a nested
 * non-`nodes` object replaced with a new-but-equal one still counts as
 * changed. This keeps the walk O(n) instead of a full deep-equal, at
 * the cost of treating an identity-compared field (a new function, a
 * new object) as a real change even when its shape didn't.
 * @param {ReadonlyArray<TreeFingerprintNode>} list
 * @returns {TreeFingerprint[]}
 */
export function fingerprintTree(list) {
  const out = [];
  for (const node of list) {
    /** @type {Record<string, unknown>} */
    const keys = {};
    for (const key of Object.keys(node)) {
      if (key === "nodes") continue;
      keys[key] = /** @type {Record<string, unknown>} */ (node)[key];
    }
    out.push({
      id: node.id,
      keys,
      children: Array.isArray(node.nodes) ? fingerprintTree(node.nodes) : [],
    });
  }
  return out;
}

/**
 * Whether `list` (the live tree, possibly mutated in place since the
 * fingerprint was taken) still matches `fingerprint`.
 * @param {TreeFingerprint[]} fingerprint
 * @param {ReadonlyArray<TreeFingerprintNode>} list
 * @returns {boolean}
 */
export function matchesFingerprint(fingerprint, list) {
  if (fingerprint.length !== list.length) return false;

  for (let i = 0; i < fingerprint.length; i++) {
    const snapshot = fingerprint[i];
    const node = /** @type {Record<string, unknown>} */ (list[i]);
    if (!Object.is(snapshot.id, node.id)) return false;

    const snapshotKeyCount = Object.keys(snapshot.keys).length;
    let nodeKeyCount = 0;
    for (const key of Object.keys(node)) {
      if (key === "nodes") continue;
      nodeKeyCount++;
      if (!(key in snapshot.keys) || !Object.is(snapshot.keys[key], node[key]))
        return false;
    }
    if (nodeKeyCount !== snapshotKeyCount) return false;

    const children = Array.isArray(node.nodes) ? node.nodes : [];
    if (snapshot.children.length === 0 && children.length === 0) continue;
    if (!matchesFingerprint(snapshot.children, /** @type {any} */ (children)))
      return false;
  }

  return true;
}
