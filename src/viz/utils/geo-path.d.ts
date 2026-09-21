export type GeoGeometry =
  | {
      type: "Polygon";
      coordinates: ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>;
    }
  | {
      type: "MultiPolygon";
      coordinates: ReadonlyArray<
        ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>
      >;
    }
  | { type: string; coordinates?: unknown };

/** A GeoJSON feature. Only polygon geometries are drawn. */
export type GeoFeature = {
  type?: "Feature";
  id?: string | number;
  properties?: Record<string, unknown> | null;
  geometry: GeoGeometry | null;
};

export type GeoCollection = {
  type?: "FeatureCollection";
  features: ReadonlyArray<GeoFeature>;
};

export type GeoInput = ReadonlyArray<GeoFeature> | GeoCollection;

export type GeoPathOptions = {
  width: number;
  height: number;
  /**
   * `"mercator"` keeps shapes and suits regions. `"equirectangular"` plots
   * degrees as they are. Both clamp nothing but mercator's poles.
   * @default "mercator"
   */
  projection?: "mercator" | "equirectangular";
  /** Room kept inside the box on every side. @default 0 */
  padding?: number;
};

export type GeoShape = {
  feature: GeoFeature;
  index: number;
  /** SVG path, or `""` for a feature with no polygon. Fill with `evenodd`. */
  path: string;
  /** Center of the feature's bounding box. */
  cx: number;
  cy: number;
};

/**
 * Project features and fit them inside a box, keeping their proportions and
 * centering them. Each feature gets one SVG path, with holes cut by the
 * even-odd rule, and the center of its bounding box for a label or a
 * tooltip. Accepts a list of features or a `FeatureCollection`.
 */
export function geoPaths(input: GeoInput, options: GeoPathOptions): GeoShape[];
