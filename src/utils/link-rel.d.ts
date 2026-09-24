/**
 * Resolve a link's `rel` attribute. An explicit `rel` wins; otherwise
 * `target="_blank"` defaults to `"noopener noreferrer"`.
 */
export function resolveLinkRel(
  target: string | null | undefined,
  rel?: string,
): string | undefined;
