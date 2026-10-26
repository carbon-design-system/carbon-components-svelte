/**
 * Dev tools mark their roots, and any probe they add to the page, with
 * this attribute. Page scans skip them, and their DOM changes do not
 * trigger a scan.
 */
export const DEV_TOOL: string;

/** The part of the page a scan covers, in page coordinates. */
export type ScanBand = { top: number; bottom: number };

/** The viewport plus one viewport height above and below, in page coordinates. */
export function scanBand(): ScanBand;

/** Whether a viewport rect overlaps `band`. */
export function inBand(
  rect: { top: number; bottom: number },
  band: ScanBand,
  scrollY: number,
): boolean;

/** Whether a mutation came from the page and not from a dev tool. */
export function fromPage(record: MutationRecord): boolean;

/**
 * Calls `callback` with a fresh scan band whenever the page may have
 * changed. Scans are throttled to one per `intervalMs` and run when the
 * browser is idle. The first scan runs at once.
 */
export function observePage(
  callback: (band: ScanBand) => void,
  options?: { intervalMs?: number; onScroll?: () => void },
): { schedule: () => void; destroy: () => void };

/**
 * Returns a lookup for the nearest box, from the element up, whose
 * `position` is one of `positions`, or `null` for the page.
 */
export function createLayerLookup(
  positions: string[],
): (el: Element) => Element | null;
