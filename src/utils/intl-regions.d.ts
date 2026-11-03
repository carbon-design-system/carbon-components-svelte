export interface RegionItem {
  /** The region code, such as "US" or "150". */
  id: string;
  /** The name in the UI locale. */
  text: string;
  /** Text the query is matched against. */
  search: string;
}

export interface RegionDetail {
  /** The region code. */
  value: string;
  /** The name in the UI locale. */
  name: string;
  /** The name in the region's main language, or `""`. */
  nativeName: string;
  /** The flag emoji, or `""` for a code that is not two letters. */
  flag: string;
}

export interface RegionSource {
  items: RegionItem[];
  /** Finish the search text now. */
  ensure(): void;
  /** Add the next slice of regions to the search text, until `deadline`. */
  warm(deadline: number): boolean;
  detail(code: string): RegionDetail;
  resolve(value: string): string;
  /** The region the UI locale is most likely used in, if listed. */
  detect(): string;
}

/** The list of regions for one picker, and the names behind its rows. */
export function createRegionSource(options: {
  locale: string;
  values?: ReadonlyArray<string>;
}): RegionSource;
