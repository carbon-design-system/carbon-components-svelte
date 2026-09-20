// @ts-check
// Histogram geometry: bar heights relative to the fullest bin, and a marker.

/**
 * Bar heights for a list of bins, as percentages of the fullest bin, with the
 * position of an optional marker across the binned domain. The bin that holds
 * the marker is flagged. A marker outside the domain is clamped to the nearer
 * end and flags that end bin.
 *
 * @param {ReadonlyArray<import("./bin.d.ts").Bin>} bins
 * @param {number | null} [marker]
 * @returns {import("./histogram.d.ts").HistogramGeometry}
 */
export function getHistogramGeometry(bins, marker) {
  const n = bins.length;
  let max = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const count = bins[i].count;
    if (count > max) max = count;
    total += count > 0 ? count : 0;
  }

  const x0 = n > 0 ? bins[0].x0 : 0;
  const x1 = n > 0 ? bins[n - 1].x1 : 0;
  const span = x1 - x0;
  const hasMarker =
    n > 0 && typeof marker === "number" && Number.isFinite(marker);

  let markedIndex = -1;
  if (hasMarker) {
    const m = /** @type {number} */ (marker);
    if (m <= x0) markedIndex = 0;
    else if (m >= x1) markedIndex = n - 1;
    else {
      for (let i = 0; i < n; i++) {
        if (m >= bins[i].x0 && m < bins[i].x1) {
          markedIndex = i;
          break;
        }
      }
    }
  }

  /** @type {import("./histogram.d.ts").HistogramBar[]} */
  const bars = new Array(n);
  for (let i = 0; i < n; i++) {
    const count = bins[i].count > 0 ? bins[i].count : 0;
    bars[i] = {
      bin: bins[i],
      pct: max > 0 ? (count / max) * 100 : 0,
      index: i,
      marked: i === markedIndex,
    };
  }

  return {
    bars,
    total,
    max,
    domain: [x0, x1],
    markerPct: hasMarker
      ? span > 0
        ? Math.min(Math.max(/** @type {number} */ (marker - x0) / span, 0), 1) *
          100
        : 50
      : null,
  };
}
