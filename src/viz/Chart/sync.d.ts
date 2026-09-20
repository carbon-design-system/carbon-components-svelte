/**
 * Shared hover between charts that declare the same `syncId`.
 */

/**
 * Join the channel `id`. `listener` hears the data-space x published by the
 * other members, or `null` when their hover clears. `publish` tells them about
 * this member's hover. A member never hears itself.
 */
export function joinSync(
  id: string,
  listener: (x: number | null) => void,
): { publish: (x: number | null) => void; leave: () => void };
