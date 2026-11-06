/**
 * The largest count, up to `upper`, for which `fits(count)` holds. The
 * count never goes below `min`: that many always show, fitting or not.
 */
export function fitCount(
  upper: number,
  fits: (count: number) => boolean,
  min?: number,
): number;
