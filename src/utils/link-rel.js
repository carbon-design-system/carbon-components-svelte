// @ts-check

/**
 * Resolve a link's `rel` attribute. An explicit `rel` wins; otherwise
 * `target="_blank"` defaults to `"noopener noreferrer"`.
 *
 * @param {string | null | undefined} target
 * @param {string} [rel]
 * @returns {string | undefined}
 */
export function resolveLinkRel(target, rel) {
  if (rel !== undefined) return rel;
  return target === "_blank" ? "noopener noreferrer" : undefined;
}
