export interface TimeZoneItem {
  /** The IANA name. */
  id: string;
  /** The city, which fills the field. */
  text: string;
  /** The area, in the UI locale. */
  group?: string;
  /** The IANA area. */
  area: string;
  /** Text the query is matched against. */
  search: string;
}

export interface TimeZoneDetail {
  /** The IANA name. */
  value: string;
  city: string;
  area: string;
  /** The generic name in the UI locale, or `""` where the engine has none. */
  name: string;
  /** Minutes east of UTC at the source's date. */
  offset: number;
  /** "UTC-08:00". */
  offsetText: string;
  /** Whether the offset differs between January and July. */
  observesDst: boolean;
  /** Whether the date falls in daylight time. */
  dst: boolean;
}

export interface TimeZoneSourceOptions {
  /** The locale the names are written in. */
  locale: string;
  /** Zones to list instead of every zone the engine knows. */
  values?: ReadonlyArray<string>;
  /** The instant offsets are read at. Defaults to now. */
  date?: Date;
  /** Replaces an area's heading. */
  groupText?: (area: string, label: string) => string;
  /** Names an area, as `Intl.DisplayNames` does for a region. */
  regionName?: (code: string) => string | undefined;
}

export interface TimeZoneSource {
  items: TimeZoneItem[];
  /** Finish the search text now. */
  ensure(): void;
  /** Add the next slice of zones to the search text, until `deadline`. */
  warm(deadline: number): boolean;
  detail(zone: string): TimeZoneDetail;
  resolve(value: string): string;
  detect(): string;
}

/**
 * Minutes east of UTC from an English offset name: "GMT+05:30" is 330.
 * `null` for a name that is not an offset, such as "PST".
 */
export function parseOffsetName(name: string): number | null;

/** "UTC+05:30", "UTC-08:00" and "UTC+00:00". */
export function formatOffset(minutes: number): string;

/**
 * The IANA zones the engine knows, plus "UTC". Empty where the engine has no
 * `Intl.supportedValuesOf`.
 */
export function listTimeZones(): string[];

/** The engine's own name for a zone, or `""` for a name it rejects. */
export function canonicalTimeZone(zone: string): string;

/** The zone the browser reports for the user, in the engine's spelling. */
export function browserTimeZone(): string;

/** Split "America/Argentina/Buenos_Aires" into its area and city. */
export function splitTimeZone(zone: string): { area: string; city: string };

/**
 * Build the zone list for one picker, and the lazily computed names, offsets
 * and abbreviations behind its rows and its search.
 */
export function createTimeZoneSource(
  options: TimeZoneSourceOptions,
): TimeZoneSource;
