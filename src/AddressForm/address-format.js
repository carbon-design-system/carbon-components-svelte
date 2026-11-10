// @ts-check
import { BoundedFifoCache } from "../utils/bounded-fifo-cache.js";
import { ADDRESS_FORMATS, DEFAULT_ADDRESS_FORMAT } from "./address-data.js";
import { ADDRESS_REGIONS } from "./address-regions.js";

/**
 * @typedef {import("./address-data.js").AddressFormat} AddressFormat
 * @typedef {"name" | "organization" | "lines" | "dependentLocality" | "locality" | "region" | "postalCode" | "sortingCode"} AddressField
 * @typedef {Object} AddressValue
 * @property {string} [country] ISO 3166-1 alpha-2 code, such as `"GB"`.
 * @property {string[]} [lines] The street address, one entry per line.
 * @property {string} [locality] City, town or post town.
 * @property {string} [region] State, province, prefecture or county.
 * @property {string} [postalCode] ZIP code, postcode or the country's own term.
 * @property {string} [sortingCode] CEDEX and similar.
 * @property {string} [dependentLocality] District, suburb or neighborhood.
 * @property {string} [organization] Company.
 * @property {string} [name] Recipient.
 * @typedef {Object} Region
 * @property {string} value The code or name stored in `region`.
 * @property {string} text What a person reads.
 * @typedef {{ field: AddressField } | { text: string }} FormatPart
 * @typedef {Object} ResolvedFormat
 * @property {string} country The upper-case code asked for.
 * @property {boolean} known Whether the table holds this country, or the generic format stands in.
 * @property {"native" | "latin"} script The script the order follows.
 * @property {FormatPart[][]} lines Each line of the format, in order.
 * @property {AddressField[][]} rows The fields of each line, in order.
 * @property {AddressField[]} fields Every field the format has.
 * @property {Set<AddressField>} required
 * @property {Set<AddressField>} upper Fields a postal label writes in capitals.
 * @property {RegExp | null} postalPattern
 * @property {string} postalExample
 * @property {string} postalType
 * @property {string} regionType
 * @property {string} localityType
 * @property {string} dependentLocalityType
 * @property {Region[] | null} regions The regions to choose from, or `null` for free text.
 * @property {[number, string] | undefined} postalSeparator
 * @typedef {Object} FormatOptions
 * @property {Record<string, AddressFormat>} [formats] Formats to use before the table's.
 * @property {Record<string, string>} [regions] Region lists to use before the table's.
 * @property {"native" | "latin"} [script] The order and region names to use. `"latin"` takes the romanized format where a country has one.
 * @typedef {"required" | "invalid"} AddressError
 * @typedef {Record<string, string> | ((key: string, format: ResolvedFormat) => string | undefined)} AddressLabels
 */

/** @type {Record<string, AddressField | undefined>} */
const TOKENS = {
  N: "name",
  O: "organization",
  A: "lines",
  D: "dependentLocality",
  C: "locality",
  S: "region",
  Z: "postalCode",
  X: "sortingCode",
};

/** @type {Map<string, FormatPart[][]>} */
const parsed = new Map();

/**
 * Split a libaddressinput format string into lines of fields and literal
 * text. `%n` ends a line. A token this table does not know, such as the
 * `%T` the data holds for India, is dropped, and a line left without a
 * field is dropped with it.
 * @param {string} fmt
 * @returns {FormatPart[][]}
 */
export function parseFormat(fmt) {
  const cached = parsed.get(fmt);
  if (cached) return cached;
  /** @type {FormatPart[][]} */
  const lines = [[]];
  let last = 0;
  /** @param {number} end */
  const flush = (end) => {
    const text = fmt.slice(last, end);
    if (text) lines[lines.length - 1].push({ text });
  };
  for (const match of fmt.matchAll(/%([A-Za-z])/g)) {
    flush(match.index);
    last = match.index + match[0].length;
    if (match[1] === "n") {
      lines.push([]);
    } else if (TOKENS[match[1]]) {
      lines[lines.length - 1].push({
        field: /** @type {AddressField} */ (TOKENS[match[1]]),
      });
    }
  }
  flush(fmt.length);
  const result = lines.filter((line) => line.some((part) => "field" in part));
  parsed.set(fmt, result);
  return result;
}

/** A postal pattern with a capital in it, such as `[A-Z]`, is one of letters. */
const UPPER_CASE_LETTER = /[A-Z]/;

/** @type {Map<string, RegExp | null>} */
const patterns = new Map();

/**
 * @param {string | undefined} source
 * @returns {RegExp | null}
 */
function postalPatternOf(source) {
  if (!source) return null;
  if (!patterns.has(source)) {
    try {
      patterns.set(source, new RegExp(`^(?:${source})$`, "i"));
    } catch {
      patterns.set(source, null);
    }
  }
  return patterns.get(source) ?? null;
}

/**
 * The regions of a country as options, or `null` where none are listed.
 * @param {string} country
 * @param {FormatOptions} [options]
 * @returns {Region[] | null}
 */
export function getRegions(country, options = {}) {
  const code = (country || "").toUpperCase();
  const raw = options.regions?.[code] ?? ADDRESS_REGIONS[code];
  if (!raw) return null;
  const latin = options.script === "latin";
  return raw.split("~").map((entry) => {
    const [key, name = "", lname = ""] = entry.split("|");
    return { value: key, text: (latin ? lname : "") || name || key };
  });
}

/**
 * Read a country's format: its lines and fields in order, which fields it
 * requires, the postal code pattern and what each field is called. A
 * country the table does not hold gets a generic format (name, company,
 * street address, city), so a form never has no fields.
 * @param {string | undefined} country
 * @param {FormatOptions} [options]
 * @returns {ResolvedFormat}
 */
export function getAddressFormat(country, options = {}) {
  const code = (country || "").toUpperCase();
  const script = options.script === "latin" ? "latin" : "native";
  const shared = !options.formats && !options.regions;
  const key = `${code}|${script}`;
  const hit = shared ? resolved.get(key) : undefined;
  if (hit) return hit;
  const format = resolve(code, options);
  if (shared) resolved.set(key, format);
  return format;
}

/** @type {Map<string, ResolvedFormat>} */
const resolved = new Map();

/**
 * @param {string} code
 * @param {FormatOptions} options
 * @returns {ResolvedFormat}
 */
function resolve(code, options) {
  const raw = options.formats?.[code] ?? ADDRESS_FORMATS[code];
  const data = {
    ...DEFAULT_ADDRESS_FORMAT,
    .../** @type {AddressFormat} */ (raw),
  };
  const script = options.script === "latin" && data.lfmt ? "latin" : "native";
  const lines = parseFormat(
    script === "latin" ? data.lfmt || data.fmt : data.fmt,
  );
  const seen = new Set();
  // A field is asked for once, though a format such as Cote d'Ivoire's
  // names its sorting code twice.
  const rows = lines
    .map((line) =>
      line.flatMap((part) =>
        "field" in part && !seen.has(part.field) && seen.add(part.field)
          ? [part.field]
          : [],
      ),
    )
    .filter((row) => row.length);
  const fields = rows.flat();
  const present = new Set(fields);
  /** @param {string} letters */
  const fieldsOf = (letters) =>
    new Set(
      [...letters].flatMap((letter) => {
        const field = TOKENS[letter];
        return field && present.has(field) ? [field] : [];
      }),
    );
  return {
    country: code,
    known: !!raw,
    script,
    lines,
    rows,
    fields,
    required: fieldsOf(data.require),
    upper: fieldsOf(data.upper),
    postalPattern: postalPatternOf(data.zip),
    postalExample: data.zipex ?? "",
    postalType: data.zipType,
    regionType: data.stateType,
    localityType: data.localityType,
    dependentLocalityType: data.subType,
    regions: present.has("region") ? getRegions(code, options) : null,
    postalSeparator: data.norm,
  };
}

/**
 * Put a postal code the way the country writes it: trimmed, in capitals
 * where its pattern has letters, with its space or hyphen in place. A
 * `sw1a1aa` becomes `SW1A 1AA` and `123456789` becomes `12345-6789`. A
 * value that does not fit the country's pattern is only trimmed and
 * upper-cased, so the field never rewrites what a person typed into
 * something else.
 * @param {string | undefined} country
 * @param {string | undefined} text
 * @param {FormatOptions} [options]
 * @returns {string}
 */
export function normalizePostalCode(country, text, options) {
  return normalizePostal(getAddressFormat(country, options), text);
}

/**
 * @param {ResolvedFormat} format
 * @param {string | undefined} text
 */
function normalizePostal(format, text) {
  const trimmed = (text ?? "").trim().replace(/\s+/g, " ");
  const pattern = format.postalPattern;
  if (!trimmed || !pattern) return trimmed;
  const letters = UPPER_CASE_LETTER.test(pattern.source);
  const fold = (/** @type {string} */ value) =>
    letters ? value.toUpperCase() : value;
  const folded = fold(trimmed);
  if (pattern.test(folded) && !format.postalSeparator) return folded;
  const compact = fold(trimmed.replace(/[\s-]+/g, ""));
  const [at, join] = format.postalSeparator ?? [0, ""];
  const split = at < 0 ? compact.length + at : at;
  const candidate =
    at && split > 0 && split < compact.length
      ? compact.slice(0, split) + join + compact.slice(split)
      : compact;
  if (pattern.test(candidate)) return candidate;
  return folded;
}

/**
 * @param {string | undefined} value
 * @returns {string}
 */
const text = (value) => (typeof value === "string" ? value : "");

/**
 * The text of a field of a value, `""` where it has none.
 * @param {AddressValue | undefined} value
 * @param {AddressField | "country"} field
 * @param {number} [index] The line, for `"lines"`.
 * @returns {string}
 */
export function fieldValue(value, field, index = 0) {
  if (!value) return "";
  return field === "lines" ? text(value.lines?.[index]) : text(value[field]);
}

/**
 * @param {Region[] | null} regions
 * @param {string} entry
 * @returns {string | undefined} The region's value when `entry` is its code or name, in any case.
 */
function matchRegion(regions, entry) {
  if (!regions) return undefined;
  const wanted = entry.trim().toLowerCase();
  return regions.find(
    (region) =>
      region.value.toLowerCase() === wanted ||
      region.text.toLowerCase() === wanted,
  )?.value;
}

/**
 * Tidy a value the way a field does when it commits: every text trimmed,
 * the postal code put as the country writes it, and a region typed or
 * autofilled by name turned into the code of the list.
 * @param {AddressValue} value
 * @param {FormatOptions} [options]
 * @returns {AddressValue}
 */
export function normalizeAddress(value, options) {
  const format = getAddressFormat(value.country, options);
  const next = { ...value };
  for (const field of /** @type {const} */ ([
    "name",
    "organization",
    "locality",
    "dependentLocality",
    "sortingCode",
  ])) {
    if (next[field] !== undefined) next[field] = text(next[field]).trim();
  }
  if (value.country) next.country = value.country.toUpperCase();
  if (value.lines) next.lines = value.lines.map((line) => text(line).trim());
  if (value.postalCode !== undefined) {
    next.postalCode = normalizePostal(format, value.postalCode);
  }
  if (value.region !== undefined) {
    const region = text(value.region).trim();
    next.region = matchRegion(format.regions, region) ?? region;
  }
  return next;
}

/**
 * @param {AddressValue | undefined} value
 * @param {AddressField} field
 */
const filled = (value, field) =>
  field === "lines"
    ? (value?.lines ?? []).some((line) => text(line).trim())
    : !!text(value?.[field]).trim();

/**
 * Check a value against its country's format: the fields it requires, the
 * postal code pattern and the region list.
 * @param {AddressValue} value
 * @param {FormatOptions & { required?: AddressField[], countryRequired?: boolean }} [options]
 *   `required` adds fields to the ones the country requires, such as `"name"`.
 * @returns {{ valid: boolean, errors: Partial<Record<AddressField | "country", AddressError>> }}
 */
export function validateAddress(value, options) {
  const format = getAddressFormat(value.country, options);
  /** @type {Partial<Record<AddressField | "country", AddressError>>} */
  const errors = {};
  if (!value.country && options?.countryRequired !== false) {
    errors.country = "required";
  }
  const required = new Set([...format.required, ...(options?.required ?? [])]);
  for (const field of format.fields) {
    if (filled(value, field)) continue;
    if (required.has(field)) errors[field] = "required";
  }
  const postalCode = text(value.postalCode).trim();
  if (
    !errors.postalCode &&
    postalCode &&
    format.fields.includes("postalCode") &&
    format.postalPattern &&
    // No postal code is longer, and a long text never reaches the pattern.
    (postalCode.length > 16 ||
      !format.postalPattern.test(normalizePostal(format, postalCode)))
  ) {
    errors.postalCode = "invalid";
  }
  const region = text(value.region).trim();
  if (
    !errors.region &&
    region &&
    format.regions &&
    matchRegion(format.regions, region) === undefined
  ) {
    errors.region = "invalid";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Move a value to another country. Fields the new country has too stay,
 * and so do a postal code that fits its pattern and a region its list
 * holds. The rest are cleared. Recipient and company always stay.
 * @param {AddressValue} value
 * @param {string} country
 * @param {FormatOptions} [options]
 * @returns {{ value: AddressValue, cleared: AddressField[] }}
 */
export function switchCountry(value, country, options) {
  const from = getAddressFormat(value.country, options);
  const to = getAddressFormat(country, options);
  /** @type {AddressValue} */
  const next = { country: country.toUpperCase() };
  /** @type {AddressField[]} */
  const cleared = [];
  /** @type {AddressField[]} */
  const every = [
    "name",
    "organization",
    "lines",
    "dependentLocality",
    "locality",
    "region",
    "postalCode",
    "sortingCode",
  ];
  for (const field of every) {
    if (!filled(value, field)) continue;
    const has = to.fields.includes(field);
    if (field === "lines") {
      next.lines = [...(value.lines ?? [])];
    } else if (field === "name" || field === "organization") {
      next[field] = value[field];
    } else if (!has) {
      cleared.push(field);
    } else if (field === "region") {
      const kept = matchRegion(to.regions, text(value.region));
      if (to.regions ? kept !== undefined : !from.regions) {
        next.region = kept ?? value.region;
      } else cleared.push(field);
    } else if (field === "postalCode") {
      const fits =
        !to.postalPattern ||
        to.postalPattern.test(normalizePostal(to, value.postalCode));
      if (fits) next.postalCode = normalizePostal(to, value.postalCode);
      else cleared.push(field);
    } else {
      next[field] = value[field];
    }
  }
  return { value: next, cleared };
}

/** @type {BoundedFifoCache<string, Intl.DisplayNames | null>} */
const displayNames = new BoundedFifoCache(16);

/**
 * The name of a country in a locale, such as `Deutschland` for `DE` in
 * `de`. Falls back to the code where the runtime has no region names.
 * @param {string} country
 * @param {string} [locale]
 * @returns {string}
 */
export function countryName(country, locale = "en") {
  let names = displayNames.get(locale);
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames(locale, { type: "region" });
    } catch {
      names = null;
    }
    displayNames.set(locale, names);
  }
  try {
    return names?.of(country.toUpperCase()) || country;
  } catch {
    return country;
  }
}

/**
 * The country a locale points at, such as `GB` for `en-GB` and `DE` for
 * `de`. `undefined` where the runtime cannot tell. A script or the
 * server's own locale never reaches this, so the result is the same on the
 * server and in the browser.
 * @param {string} locale
 * @returns {string | undefined}
 */
export function countryFromLocale(locale) {
  try {
    return new Intl.Locale(locale).maximize().region;
  } catch {
    return undefined;
  }
}

/**
 * Country options sorted by name in a locale.
 * @param {string[]} codes
 * @param {string} [locale]
 * @returns {{ value: string, text: string }[]}
 */
export function countryOptions(codes, locale = "en") {
  const collator = new Intl.Collator(locale);
  return codes
    .map((value) => ({ value, text: countryName(value, locale) }))
    .sort((a, b) => collator.compare(a.text, b.text));
}

/**
 * The `autocomplete` token a field takes, so a browser fills it. A
 * sorting code has none.
 * @param {AddressField | "country"} field
 * @param {number} [index] The line, for `"lines"`.
 * @returns {string | undefined}
 */
export function autocompleteToken(field, index = 0) {
  switch (field) {
    case "country":
      return "country";
    case "name":
      return "name";
    case "organization":
      return "organization";
    case "lines":
      return `address-line${index + 1}`;
    case "dependentLocality":
      return "address-level3";
    case "locality":
      return "address-level2";
    case "region":
      return "address-level1";
    case "postalCode":
      return "postal-code";
    default:
      return undefined;
  }
}

/**
 * @param {FormatPart[]} line
 * @param {Map<AddressField, string>} texts
 * @returns {string}
 */
function joinLine(line, texts) {
  let out = "";
  let pending = "";
  let seen = false;
  for (const part of line) {
    if ("text" in part) {
      pending = part.text;
      continue;
    }
    const entry = texts.get(part.field);
    if (!entry) {
      seen = true;
      continue;
    }
    // A literal goes with the field after it, and the last one before a
    // field wins, so `%C, %S %Z` with no region reads "City 12345". The
    // first field there is takes its literal only when nothing came before
    // it in the line, like the 〒 before a postal code.
    out += (out || !seen ? pending : "") + entry;
    pending = "";
    seen = true;
  }
  return out.trim();
}

/**
 * Lay a value out as the lines of a postal label, in the order and with
 * the punctuation its country writes: `["Jane Doe", "1 Main St", "Cupertino,
 * CA 95014", "United States"]`. An empty field takes its punctuation with
 * it, and a line with nothing on it is left out.
 * @param {AddressValue} value
 * @param {FormatOptions & {
 *   locale?: string,
 *   includeCountry?: boolean,
 *   postal?: boolean,
 * }} [options] `includeCountry` (default `true`) adds the country's name as the last line. `postal` writes the fields and the country the country's postal service writes in capitals.
 * @returns {string[]}
 */
export function formatAddress(value, options = {}) {
  const format = getAddressFormat(value.country, options);
  const regions = format.regions;
  /** @type {string[]} */
  const out = [];
  for (const line of format.lines) {
    /** @type {Map<AddressField, string>} */
    const texts = new Map();
    for (const part of line) {
      if (!("field" in part)) continue;
      const field = part.field;
      if (field === "lines") continue;
      let entry = text(value[field]).trim();
      // A key such as "CA" is what a label writes; only the romanized
      // order needs the name, since a key may be in another script.
      if (field === "region" && regions && format.script === "latin") {
        entry = regions.find((r) => r.value === entry)?.text ?? entry;
      }
      if (options.postal && format.upper.has(field)) {
        entry = entry.toLocaleUpperCase(options.locale);
      }
      texts.set(field, entry);
    }
    if (line.some((part) => "field" in part && part.field === "lines")) {
      for (const entry of value.lines ?? []) {
        const trimmed = text(entry).trim();
        if (trimmed) out.push(trimmed);
      }
    }
    const joined = joinLine(line, texts);
    if (joined) out.push(joined);
  }
  if (options.includeCountry !== false && value.country) {
    const name = countryName(value.country, options.locale);
    out.push(options.postal ? name.toLocaleUpperCase(options.locale) : name);
  }
  return out;
}

/**
 * @typedef {Object} AddressLayoutItem
 * @property {string} key `"line1"`, `"locality"`, and so on. Stable across countries, so a field keeps its element when the country changes.
 * @property {AddressField} field
 * @property {number} index The line, for `"lines"`.
 * @property {number} span Columns of 12 the field takes.
 */

/** @type {Partial<Record<AddressField, number>>} */
const WEIGHTS = { locality: 2 };

/**
 * Turn a format into the fields of a form, in order, with the columns each
 * takes of a 12-column grid. Fields that share a line of the format share a
 * row: city, region and postal code on one row in the United States, the
 * postal code before the city in Germany. The street address, and any line
 * it shares, takes a row of its own per field. A field is left out unless
 * the format has it and it is a street address, a locality or a postal code
 * or `include` names it.
 * @param {ResolvedFormat} format
 * @param {{ addressLines?: number, include?: AddressField[] }} [options]
 * @returns {AddressLayoutItem[]}
 */
export function layoutFields(format, options = {}) {
  const lineCount = Math.max(1, Math.min(options.addressLines ?? 2, 4));
  const optIn = new Set(["name", "organization", "sortingCode"]);
  const include = new Set(options.include);
  /** @type {AddressLayoutItem[]} */
  const items = [];
  for (const row of format.rows) {
    const fields = row.filter(
      (field) => !optIn.has(field) || include.has(field),
    );
    if (!fields.length) continue;
    if (fields.includes("lines") || fields.length === 1) {
      for (const field of fields) {
        const count = field === "lines" ? lineCount : 1;
        for (let index = 0; index < count; index++) {
          items.push({
            key: field === "lines" ? `line${index + 1}` : field,
            field,
            index,
            span: 12,
          });
        }
      }
      continue;
    }
    const total = fields.reduce((sum, field) => sum + (WEIGHTS[field] ?? 1), 0);
    let left = 12;
    fields.forEach((field, i) => {
      const span =
        i === fields.length - 1
          ? left
          : Math.round((12 * (WEIGHTS[field] ?? 1)) / total);
      left -= span;
      items.push({ key: field, field, index: 0, span });
    });
  }
  return items;
}

/** @type {Record<string, string>} */
const POSTAL_LABELS = {
  zip: "ZIP code",
  postal: "Postal code",
  pin: "PIN code",
  eircode: "Eircode",
  postcode: "Postcode",
  plz: "PLZ",
  cep: "CEP",
};

/** @type {Record<string, string>} */
const REGION_LABELS = {
  state: "State",
  province: "Province",
  prefecture: "Prefecture",
  county: "County",
  department: "Department",
  emirate: "Emirate",
  area: "Area",
  do_si: "Province",
  oblast: "Region",
  district: "District",
  island: "Island",
  parish: "Parish",
};

/** @type {Record<string, string>} */
const LOCALITY_LABELS = {
  city: "City",
  post_town: "Town/City",
  district: "District",
  suburb: "Suburb",
};

/** @type {Record<string, string>} */
const DEPENDENT_LABELS = {
  suburb: "Suburb",
  neighborhood: "Neighborhood",
  district: "District",
  townland: "Townland",
  bairro: "Bairro",
  village_township: "Village/Township",
};

/**
 * The English label of a field in a country: "ZIP code" in the United
 * States, "Postcode" in the United Kingdom, "PLZ" in Germany, "CEP" and
 * "Bairro" in Brazil, "Prefecture" in Japan.
 * @param {AddressField | "country"} field
 * @param {ResolvedFormat} format
 * @param {number} [index] The line, for `"lines"`.
 * @returns {string}
 */
export function addressLabel(field, format, index = 0) {
  switch (field) {
    case "country":
      return "Country";
    case "name":
      return "Full name";
    case "organization":
      return "Company";
    case "lines":
      return `Address line ${index + 1}`;
    case "dependentLocality":
      return DEPENDENT_LABELS[format.dependentLocalityType] ?? "District";
    case "locality":
      return LOCALITY_LABELS[format.localityType] ?? "City";
    case "region":
      return REGION_LABELS[format.regionType] ?? "Province";
    case "postalCode":
      return POSTAL_LABELS[format.postalType] ?? "Postal code";
    default:
      return "Sorting code";
  }
}
