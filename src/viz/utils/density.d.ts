export type DensityOptions = {
  /** Kernel width. Defaults to Silverman's rule of thumb. */
  bandwidth?: number;
  /** How many points to sample the curve at. */
  points?: number;
  /** Where to sample. Defaults to the sample's range plus three bandwidths. */
  domain?: [number, number];
};

export type Density = {
  points: Array<{ x: number; y: number }>;
  bandwidth: number;
  /** The highest density. */
  peak: number;
  count: number;
};

/** Silverman's rule-of-thumb bandwidth for an ascending sample. */
export function silverman(sorted: ReadonlyArray<number>): number;

/** A Gaussian kernel density estimate sampled across a domain. */
export function kernelDensity(
  values: ReadonlyArray<number | null | undefined>,
  options?: DensityOptions,
): Density;
