// @ts-check
// Project GeoJSON polygons onto a box and write them as SVG paths.

const RADIANS = Math.PI / 180;
/** Mercator stretches without bound toward the poles, so it stops short. */
const MAX_LATITUDE = 85.05113;

/**
 * Longitude and latitude, in degrees, to unitless plane coordinates with y
 * growing downward, as SVG has it.
 *
 * @param {number} longitude
 * @param {number} latitude
 * @param {"mercator" | "equirectangular"} projection
 * @returns {[number, number]}
 */
function project(longitude, latitude, projection) {
  if (projection === "equirectangular") return [longitude, -latitude];
  const clamped = Math.min(Math.max(latitude, -MAX_LATITUDE), MAX_LATITUDE);
  return [
    longitude,
    -Math.log(Math.tan(Math.PI / 4 + (clamped * RADIANS) / 2)) / RADIANS,
  ];
}

/**
 * Every outer and inner ring of a feature's geometry. Geometries other than
 * polygons have no area to fill, so they give no rings.
 *
 * @param {import("./geo-path.d.ts").GeoFeature} feature
 * @returns {ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>}
 */
function ringsOf(feature) {
  const geometry = feature.geometry;
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

/**
 * Project features and fit them inside a box, keeping their proportions and
 * centering them. Each feature gets one SVG path, with holes cut by the
 * even-odd rule, and the center of its bounding box for a label or a
 * tooltip. Accepts a list of features or a `FeatureCollection`.
 *
 * @param {import("./geo-path.d.ts").GeoInput} input
 * @param {import("./geo-path.d.ts").GeoPathOptions} options
 * @returns {import("./geo-path.d.ts").GeoShape[]}
 */
export function geoPaths(input, options) {
  const { width, height, projection = "mercator", padding = 0 } = options;
  const features = Array.isArray(input)
    ? input
    : /** @type {import("./geo-path.d.ts").GeoCollection} */ (input).features;

  let x0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  // Project once and keep the result: the fit needs every point before any
  // path can be written.
  const projected = features.map((feature) =>
    ringsOf(feature).map((ring) => {
      /** @type {Array<[number, number]>} */
      const points = [];
      for (const position of ring) {
        const [x, y] = project(position[0], position[1], projection);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        points.push([x, y]);
      }
      return points;
    }),
  );

  const spanX = x1 - x0;
  const spanY = y1 - y0;
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const scale =
    spanX > 0 && spanY > 0
      ? Math.min(innerWidth / spanX, innerHeight / spanY)
      : spanX > 0
        ? innerWidth / spanX
        : spanY > 0
          ? innerHeight / spanY
          : 1;
  const offsetX = padding + (innerWidth - spanX * scale) / 2;
  const offsetY = padding + (innerHeight - spanY * scale) / 2;
  /** @param {number} n */
  const round = (n) => Math.round(n * 10) / 10;

  return features.map((feature, index) => {
    /** @type {string[]} */
    const parts = [];
    let fx0 = Number.POSITIVE_INFINITY;
    let fx1 = Number.NEGATIVE_INFINITY;
    let fy0 = Number.POSITIVE_INFINITY;
    let fy1 = Number.NEGATIVE_INFINITY;
    for (const ring of projected[index]) {
      if (ring.length < 3) continue;
      const commands = new Array(ring.length);
      for (let i = 0; i < ring.length; i++) {
        const x = offsetX + (ring[i][0] - x0) * scale;
        const y = offsetY + (ring[i][1] - y0) * scale;
        if (x < fx0) fx0 = x;
        if (x > fx1) fx1 = x;
        if (y < fy0) fy0 = y;
        if (y > fy1) fy1 = y;
        commands[i] = `${i === 0 ? "M" : "L"}${round(x)},${round(y)}`;
      }
      parts.push(`${commands.join("")}Z`);
    }
    const drawn = parts.length > 0;
    return {
      feature,
      index,
      path: parts.join(""),
      cx: drawn ? round((fx0 + fx1) / 2) : 0,
      cy: drawn ? round((fy0 + fy1) / 2) : 0,
    };
  });
}
