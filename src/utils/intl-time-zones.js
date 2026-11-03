// @ts-check
// Time zones from the browser's own `Intl` data: the list, the names, the
// offsets and the abbreviations. Nothing here is shipped data, bar the few
// renamed cities below.
import { BoundedFifoCache } from "./bounded-fifo-cache.js";
import { searchText } from "./intl-search.js";

/**
 * Engines list the zones under the names their ICU build knows, and some
 * still use the old ones ("Asia/Calcutta"). These are the renamed cities,
 * shown under their current name and still found under the old one.
 */
const RENAMED = new Map([
  ["Africa/Asmera", "Asmara"],
  ["America/Godthab", "Nuuk"],
  ["Asia/Calcutta", "Kolkata"],
  ["Asia/Katmandu", "Kathmandu"],
  ["Asia/Rangoon", "Yangon"],
  ["Asia/Saigon", "Ho Chi Minh City"],
  ["Atlantic/Faeroe", "Faroe"],
  ["Europe/Kiev", "Kyiv"],
  ["Pacific/Enderbury", "Kanton"],
  ["Pacific/Ponape", "Pohnpei"],
  ["Pacific/Truk", "Chuuk"],
]);

/**
 * The same renames as full IANA names, old to current. V8 canonicalizes an
 * alias to the old name, JavaScriptCore keeps whatever it is given, and the
 * engines list different spellings, so a value saved in one browser is looked
 * up under both. The full set of differences is a job for a shared util.
 */
const CURRENT_NAMES = new Map([
  ["Africa/Asmera", "Africa/Asmara"],
  ["America/Godthab", "America/Nuuk"],
  ["Asia/Calcutta", "Asia/Kolkata"],
  ["Asia/Katmandu", "Asia/Kathmandu"],
  ["Asia/Rangoon", "Asia/Yangon"],
  ["Asia/Saigon", "Asia/Ho_Chi_Minh"],
  ["Atlantic/Faeroe", "Atlantic/Faroe"],
  ["Europe/Kiev", "Europe/Kyiv"],
  ["Pacific/Enderbury", "Pacific/Kanton"],
  ["Pacific/Ponape", "Pacific/Pohnpei"],
  ["Pacific/Truk", "Pacific/Chuuk"],
]);

/** @type {Map<string, string> | undefined} */
let otherSpellings;

/**
 * A zone's other spelling: old for current and current for old, and "UTC"
 * for its aliases. Built on first use, so importing the module runs nothing.
 * @param {string} zone
 * @returns {string | undefined}
 */
function otherSpelling(zone) {
  if (!otherSpellings) {
    otherSpellings = new Map();
    for (const [old, current] of CURRENT_NAMES) {
      otherSpellings.set(old, current);
      otherSpellings.set(current, old);
    }
    for (const alias of "Etc/UTC Etc/UCT Etc/GMT Etc/Universal Etc/Zulu GMT UCT Universal Zulu".split(
      " ",
    )) {
      otherSpellings.set(alias, "UTC");
    }
  }
  return otherSpellings.get(zone);
}

/** The UN M.49 or ISO region whose name the area is shown under. */
const AREA_REGIONS = new Map([
  ["Africa", "002"],
  ["America", "019"],
  ["Antarctica", "AQ"],
  ["Asia", "142"],
  ["Australia", "AU"],
  ["Europe", "150"],
  ["Pacific", "009"],
]);

/**
 * The English that names a zone's abbreviation ("PST", "CET", "AEST"), by
 * area. The Americas and the rest are in en-US. Where English has none, as
 * for most of Asia, `Intl` falls back to "GMT+9", which is not kept.
 */
const ABBREVIATION_LOCALES = new Map([
  ["Africa", "en-GB"],
  ["Arctic", "en-GB"],
  ["Atlantic", "en-GB"],
  ["Australia", "en-AU"],
  ["Europe", "en-GB"],
]);

const OFFSET_NAME = /^(?:GMT|UTC)(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/;
const ABBREVIATION = /^[A-Za-z]{2,5}$/;
const DIGIT = /\d/;

/** @type {BoundedFifoCache<string, Intl.DateTimeFormat | null>} */
const formatterCache = new BoundedFifoCache(2048);

/**
 * One formatter per zone, kind and locale, shared by every picker. Building
 * one is most of the cost of naming a zone.
 * @param {string} locale
 * @param {string} zone
 * @param {string} kind A `timeZoneName` value.
 * @returns {Intl.DateTimeFormat | null} `null` when the engine rejects the
 * zone or the name style.
 */
function getFormatter(locale, zone, kind) {
  const key = `${kind}|${locale}|${zone}`;
  let formatter = formatterCache.get(key);
  if (formatter === undefined) {
    try {
      formatter = new Intl.DateTimeFormat(locale, {
        timeZone: zone,
        timeZoneName: /** @type {any} */ (kind),
      });
    } catch {
      formatter = null;
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * @param {Intl.DateTimeFormat | null} formatter
 * @param {Date} date
 * @returns {string}
 */
function zoneNameAt(formatter, date) {
  if (!formatter) return "";
  for (const part of formatter.formatToParts(date)) {
    if (part.type === "timeZoneName") return part.value;
  }
  return "";
}

/**
 * Minutes east of UTC from an English offset name: "GMT+05:30" is 330, "GMT"
 * and "UTC" are 0. `null` for a name that is not an offset, such as "PST".
 * @param {string} name
 * @returns {number | null}
 */
export function parseOffsetName(name) {
  const match = OFFSET_NAME.exec(name);
  if (!match) return null;
  const [, sign, hours, minutes] = match;
  if (!sign) return 0;
  const total = Number(hours) * 60 + Number(minutes ?? 0);
  return sign === "-" ? -total : total;
}

/**
 * "UTC+05:30", "UTC-08:00" and "UTC+00:00". ASCII, so it matches what a
 * person types, and written left to right whatever the page's direction.
 * @param {number} minutes Minutes east of UTC.
 * @returns {string}
 */
export function formatOffset(minutes) {
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${minutes < 0 ? "-" : "+"}${hh}:${mm}`;
}

/**
 * The IANA zones the engine knows, with "UTC" first. V8 leaves "UTC" out of
 * `supportedValuesOf`, and JavaScriptCore and SpiderMonkey list it. Those two
 * also list the `Etc/GMT+N` zones, which are not places and whose sign is
 * inverted ("Etc/GMT+1" is UTC-01:00), so they are left out as V8 leaves
 * them. Empty where the engine has no `supportedValuesOf`.
 * @returns {string[]}
 */
export function listTimeZones() {
  if (typeof Intl.supportedValuesOf !== "function") return [];
  return [
    "UTC",
    ...Intl.supportedValuesOf("timeZone").filter(
      (zone) => zone !== "UTC" && !zone.startsWith("Etc/"),
    ),
  ];
}

/**
 * The engine's own name for a zone, which is how `listTimeZones` spells it:
 * "Asia/Kolkata" is "Asia/Calcutta" in Chromium. `""` for a name the engine
 * rejects.
 * @param {string} zone
 * @returns {string}
 */
export function canonicalTimeZone(zone) {
  if (!zone) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
    }).resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

/**
 * The zone the browser reports for the user, in the engine's spelling.
 * @returns {string}
 */
export function browserTimeZone() {
  if (typeof Intl === "undefined") return "";
  return canonicalTimeZone(
    new Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  );
}

/**
 * Split "America/Argentina/Buenos_Aires" into its area and city.
 * @param {string} zone
 * @returns {{ area: string; city: string }}
 */
export function splitTimeZone(zone) {
  const slash = zone.indexOf("/");
  const area = slash < 0 ? "" : zone.slice(0, slash);
  const city = RENAMED.get(zone) ?? zone.slice(zone.lastIndexOf("/") + 1);
  return { area, city: city.replace(/_/g, " ") };
}

/**
 * The area's heading: "America" is "Americas" and "Asia" is "Asia", in the
 * UI locale. Areas that no region names ("Atlantic", "Indian") keep their
 * IANA name.
 * @param {string} area
 * @param {(code: string) => string | undefined} regionName
 * @returns {string}
 */
function areaLabel(area, regionName) {
  const code = AREA_REGIONS.get(area);
  return (code && regionName(code)) || area;
}

/**
 * @typedef {object} TimeZoneItem
 * @property {string} id The IANA name.
 * @property {string} text The city, which fills the field.
 * @property {string} [group] The area, localized.
 * @property {string} area The IANA area.
 * @property {string} search Folded text the query is matched against.
 */

/**
 * @typedef {object} TimeZoneDetail
 * @property {string} value The IANA name.
 * @property {string} city
 * @property {string} area
 * @property {string} name The generic name in the UI locale ("Pacific Time"),
 * or `""` where the engine has none.
 * @property {number} offset Minutes east of UTC at the source's date.
 * @property {string} offsetText "UTC-08:00".
 * @property {boolean} observesDst Whether the offset differs between January
 * and July.
 * @property {boolean} dst Whether the date falls in daylight time.
 */

/**
 * @typedef {object} TimeZoneSourceOptions
 * @property {string} locale The locale the names are written in.
 * @property {ReadonlyArray<string>} [values] Zones to list instead of every
 * zone the engine knows.
 * @property {Date | null} [date] The instant offsets are read at. Defaults to
 * now. `null` reads no clock and no host zone, for the server render and the
 * first client paint: rows have no offset or name, and search matches the
 * city, the IANA name and the area only.
 * @property {(area: string, label: string) => string} [groupText] Replaces an
 * area's heading.
 * @property {(code: string) => string | undefined} [regionName] Names an
 * area, as `Intl.DisplayNames` does for a region.
 */

/**
 * Build the zone list for one picker, and the lazily computed names, offsets
 * and abbreviations behind its rows and its search.
 *
 * Listing is cheap: it needs no formatter. A row asks `detail()` for its
 * offset and name, so a windowed menu pays for the rows on screen. Search
 * needs every zone's offsets, abbreviations and names, so the source builds
 * that text in slices (`warm`) while the browser is idle, and `ensure()`
 * finishes it at once if a query arrives first.
 *
 * @param {TimeZoneSourceOptions} options
 */
export function createTimeZoneSource(options) {
  const { locale, groupText, regionName = () => undefined } = options;
  const fixedDate = options.date;
  const clock = fixedDate !== null;
  const getDate = () => fixedDate ?? new Date();

  const zones = options.values
    ? unique(options.values.map(canonicalTimeZone).filter(Boolean))
    : listTimeZones();
  if (!options.values && zones.length === 0) {
    const own = clock ? browserTimeZone() : "";
    if (own) zones.push(own);
    if (!zones.includes("UTC")) zones.unshift("UTC");
  }

  /** @type {TimeZoneItem[]} */
  const items = zones.map((zone) => {
    const { area, city } = splitTimeZone(zone);
    const heading = area ? areaLabel(area, regionName) : "";
    return {
      id: zone,
      text: city,
      group: heading ? (groupText?.(area, heading) ?? heading) : undefined,
      area,
      // The other spelling too, so "calcutta" finds Kolkata in any engine.
      search: searchText([city, zone, otherSpelling(zone) ?? "", heading]),
    };
  });
  if (!options.values) {
    const collator = new Intl.Collator("en");
    items.sort(
      (a, b) =>
        collator.compare(a.area, b.area) || collator.compare(a.text, b.text),
    );
  }

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const baseSearch = items.map((item) => item.search);

  /** @type {Map<string, { offset: number; text: string }>} */
  let offsets = new Map();
  let offsetMinute = -1;

  /**
   * Offset at the source's date, read at most once a minute for each zone.
   * @param {string} zone
   * @returns {number}
   */
  function offsetNow(zone) {
    const date = getDate();
    const minute = Math.floor(date.getTime() / 60000);
    if (minute !== offsetMinute) {
      offsetMinute = minute;
      offsets = new Map();
    }
    let entry = offsets.get(zone);
    if (!entry) {
      const offset =
        parseOffsetName(
          zoneNameAt(getFormatter("en-US", zone, "longOffset"), date),
        ) ?? 0;
      entry = { offset, text: formatOffset(offset) };
      offsets.set(zone, entry);
    }
    return entry.offset;
  }

  /** @type {Map<string, string>} */
  const names = new Map();

  /**
   * @param {string} zone
   * @returns {string}
   */
  function genericName(zone) {
    let name = names.get(zone);
    if (name === undefined) {
      const date = getDate();
      name = zoneNameAt(getFormatter(locale, zone, "longGeneric"), date);
      if (!name || DIGIT.test(name)) {
        name =
          zone === "UTC"
            ? zoneNameAt(getFormatter(locale, zone, "long"), date)
            : "";
        if (DIGIT.test(name)) name = "";
      }
      names.set(zone, name);
    }
    return name;
  }

  /** @type {Map<string, { std: number; dst: number; abbreviations: string[] }>} */
  const seasonCache = new Map();

  /**
   * January and July offsets, and the abbreviations in use then.
   * @param {string} zone
   * @returns {{ std: number; dst: number; abbreviations: string[] }}
   */
  function seasons(zone) {
    let cached = seasonCache.get(zone);
    if (!cached) {
      cached = computeSeasons(zone);
      seasonCache.set(zone, cached);
    }
    return cached;
  }

  /**
   * @param {string} zone
   * @returns {{ std: number; dst: number; abbreviations: string[] }}
   */
  function computeSeasons(zone) {
    const year = getDate().getUTCFullYear();
    const january = new Date(Date.UTC(year, 0, 1, 12));
    const july = new Date(Date.UTC(year, 6, 1, 12));
    const long = getFormatter("en-US", zone, "longOffset");
    const a = parseOffsetName(zoneNameAt(long, january)) ?? 0;
    const b = parseOffsetName(zoneNameAt(long, july)) ?? 0;
    const short = getFormatter(
      ABBREVIATION_LOCALES.get(splitTimeZone(zone).area) ??
        (zone === "Asia/Calcutta" ? "en-IN" : "en-US"),
      zone,
      "short",
    );
    /** @type {string[]} */
    const abbreviations = [];
    for (const name of [zoneNameAt(short, january), zoneNameAt(short, july)]) {
      if (ABBREVIATION.test(name) && !abbreviations.includes(name)) {
        abbreviations.push(name);
      }
    }
    return { std: Math.min(a, b), dst: Math.max(a, b), abbreviations };
  }

  /**
   * @param {number} minutes
   * @returns {string}
   */
  function offsetTokens(minutes) {
    const text = formatOffset(minutes).slice(3);
    return minutes === 0 ? `${text} utc gmt` : text;
  }

  let built = 0;

  /**
   * Add the next slice of zones to the search text, until `deadline`
   * (a `performance.now()` time).
   * @param {number} deadline
   * @returns {boolean} Whether every zone is done.
   */
  function warm(deadline) {
    if (!clock) return true;
    while (built < items.length) {
      const item = items[built];
      const zone = item.id;
      const { std, dst, abbreviations } = seasons(zone);
      const current = offsetNow(zone);
      const tokens = new Set([offsetTokens(std), offsetTokens(dst)]);
      tokens.add(offsetTokens(current));
      item.search = searchText([
        baseSearch[built],
        ...tokens,
        ...abbreviations,
        genericName(zone),
      ]);
      built++;
      if (built < items.length && performance.now() >= deadline) return false;
    }
    return true;
  }

  /** Finish the search text now. */
  function ensure() {
    if (built < items.length) warm(Number.POSITIVE_INFINITY);
  }

  /**
   * @param {string} zone
   * @returns {TimeZoneDetail}
   */
  function detail(zone) {
    const item = itemsById.get(zone);
    const { area, city } = splitTimeZone(zone);
    if (!clock) {
      return {
        value: zone,
        city: item?.text ?? city,
        area,
        name: "",
        offset: 0,
        offsetText: "",
        observesDst: false,
        dst: false,
      };
    }
    const offset = offsetNow(zone);
    const { std, dst } = seasons(zone);
    return {
      value: zone,
      city: item?.text ?? city,
      area,
      name: genericName(zone),
      offset,
      offsetText: formatOffset(offset),
      observesDst: std !== dst,
      dst: std !== dst && offset === dst,
    };
  }

  return {
    items,
    ensure,
    warm,
    detail,
    /**
     * The id the list uses for `value`, or `value` itself if it is not a zone.
     * @param {string} value
     * @returns {string}
     */
    resolve(value) {
      if (itemsById.has(value)) return value;
      const canonical = canonicalTimeZone(value);
      for (const name of [canonical, otherSpelling(value)]) {
        if (name && itemsById.has(name)) return name;
      }
      const other = otherSpelling(canonical);
      if (other && itemsById.has(other)) return other;
      return canonical || value;
    },
    detect: browserTimeZone,
  };
}

/**
 * @template T
 * @param {T[]} list
 * @returns {T[]}
 */
function unique(list) {
  return [...new Set(list)];
}
