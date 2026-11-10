import type { AddressFormat } from "./address-data";

export type { AddressFormat };

export type AddressField =
  | "name"
  | "organization"
  | "lines"
  | "dependentLocality"
  | "locality"
  | "region"
  | "postalCode"
  | "sortingCode";

export interface AddressValue {
  /** ISO 3166-1 alpha-2 code, such as `"GB"`. */
  country?: string;
  /** The street address, one entry per line. */
  lines?: string[];
  /** City, town or post town. */
  locality?: string;
  /** State, province, prefecture or county. */
  region?: string;
  /** ZIP code, postcode or the country's own term. */
  postalCode?: string;
  /** CEDEX and similar. */
  sortingCode?: string;
  /** District, suburb or neighborhood. */
  dependentLocality?: string;
  /** Company. */
  organization?: string;
  /** Recipient. */
  name?: string;
}

export interface AddressRegion {
  /** The code or name stored in `region`. */
  value: string;
  /** What a person reads. */
  text: string;
}

export type AddressFormatPart = { field: AddressField } | { text: string };

export type AddressError = "required" | "invalid";

/**
 * Labels by key (`country`, `name`, `organization`, `line1`, `line2`,
 * `dependentLocality`, `locality`, `region`, `postalCode`, `sortingCode`), or
 * a function that returns `undefined` to keep the default.
 */
export type AddressLabels =
  | Record<string, string>
  | ((key: string, format: ResolvedAddressFormat) => string | undefined);

export interface AddressFormatOptions {
  /** Formats to use before the table's. */
  formats?: Record<string, AddressFormat>;
  /** Region lists to use before the table's, as `key|name|latin name` joined by `~`. */
  regions?: Record<string, string>;
  /**
   * The order and region names to use. `"latin"` takes the romanized format
   * where a country has one.
   */
  script?: "native" | "latin";
}

export interface ResolvedAddressFormat {
  /** The upper-case code asked for. */
  country: string;
  /** Whether the table holds this country, or the generic format stands in. */
  known: boolean;
  /** The script the order follows. */
  script: "native" | "latin";
  /** Each line of the format, in order. */
  lines: AddressFormatPart[][];
  /** The fields of each line, in order. */
  rows: AddressField[][];
  /** Every field the format has. */
  fields: AddressField[];
  required: Set<AddressField>;
  /** Fields a postal label writes in capitals. */
  upper: Set<AddressField>;
  postalPattern: RegExp | null;
  postalExample: string;
  postalType: string;
  regionType: string;
  localityType: string;
  dependentLocalityType: string;
  /** The regions to choose from, or `null` for free text. */
  regions: AddressRegion[] | null;
  postalSeparator: [number, string] | undefined;
}

/**
 * Split a libaddressinput format string into lines of fields and literal
 * text. `%n` ends a line. A token this table does not know is dropped, and
 * a line left without a field is dropped with it.
 */
export function parseFormat(fmt: string): AddressFormatPart[][];

/** The regions of a country as options, or `null` where none are listed. */
export function getRegions(
  country: string,
  options?: AddressFormatOptions,
): AddressRegion[] | null;

/**
 * Read a country's format: its lines and fields in order, which fields it
 * requires, the postal code pattern and what each field is called. A
 * country the table does not hold gets a generic format (name, company,
 * street address, city), so a form never has no fields.
 */
export function getAddressFormat(
  country: string | undefined,
  options?: AddressFormatOptions,
): ResolvedAddressFormat;

/**
 * Put a postal code the way the country writes it: trimmed, in capitals
 * where its pattern has letters, with its space or hyphen in place. A value
 * that does not fit the country's pattern is only trimmed and upper-cased.
 */
export function normalizePostalCode(
  country: string | undefined,
  text: string | undefined,
  options?: AddressFormatOptions,
): string;

/** The text of a field of a value, `""` where it has none. */
export function fieldValue(
  value: AddressValue | undefined,
  field: AddressField | "country",
  index?: number,
): string;

/**
 * Tidy a value the way a field does when it commits: every text trimmed,
 * the postal code put as the country writes it, and a region typed or
 * autofilled by name turned into the code of the list.
 */
export function normalizeAddress(
  value: AddressValue,
  options?: AddressFormatOptions,
): AddressValue;

/**
 * Check a value against its country's format: the fields it requires, the
 * postal code pattern and the region list. `required` adds fields to the
 * ones the country requires, such as `"name"`.
 */
export function validateAddress(
  value: AddressValue,
  options?: AddressFormatOptions & {
    required?: AddressField[];
    countryRequired?: boolean;
  },
): {
  valid: boolean;
  errors: Partial<Record<AddressField | "country", AddressError>>;
};

/**
 * Move a value to another country. Fields the new country has too stay,
 * and so do a postal code that fits its pattern and a region its list
 * holds. The rest are cleared. Recipient and company always stay.
 */
export function switchCountry(
  value: AddressValue,
  country: string,
  options?: AddressFormatOptions,
): { value: AddressValue; cleared: AddressField[] };

/**
 * The name of a country in a locale, such as `Deutschland` for `DE` in
 * `de`. Falls back to the code where the runtime has no region names.
 */
export function countryName(country: string, locale?: string): string;

/**
 * The country a locale points at, such as `GB` for `en-GB` and `DE` for
 * `de`. `undefined` where the runtime cannot tell.
 */
export function countryFromLocale(locale: string): string | undefined;

/** Country options sorted by name in a locale. */
export function countryOptions(
  codes: string[],
  locale?: string,
): { value: string; text: string }[];

/**
 * The `autocomplete` token a field takes, so a browser fills it. A sorting
 * code has none.
 */
export function autocompleteToken(
  field: AddressField | "country",
  index?: number,
): string | undefined;

/**
 * Lay a value out as the lines of a postal label, in the order and with the
 * punctuation its country writes. An empty field takes its punctuation with
 * it, and a line with nothing on it is left out. `includeCountry` (default
 * `true`) adds the country's name as the last line. `postal` writes the
 * fields and the country the country's postal service writes in capitals.
 */
export function formatAddress(
  value: AddressValue,
  options?: AddressFormatOptions & {
    locale?: string;
    includeCountry?: boolean;
    postal?: boolean;
  },
): string[];

export interface AddressLayoutItem {
  /**
   * `"line1"`, `"locality"`, and so on. Stable across countries, so a field
   * keeps its element when the country changes.
   */
  key: string;
  field: AddressField;
  /** The line, for `"lines"`. */
  index: number;
  /** Columns of 12 the field takes. */
  span: number;
}

/**
 * Turn a format into the fields of a form, in order, with the columns each
 * takes of a 12-column grid. Fields that share a line of the format share a
 * row: city, region and postal code on one row in the United States, the
 * postal code before the city in Germany. The street address, and any line
 * it shares, takes a row of its own per field. Name, company and sorting
 * code are left out unless `include` names them.
 */
export function layoutFields(
  format: ResolvedAddressFormat,
  options?: { addressLines?: number; include?: AddressField[] },
): AddressLayoutItem[];

/**
 * The English label of a field in a country: "ZIP code" in the United
 * States, "Postcode" in the United Kingdom, "PLZ" in Germany, "CEP" and
 * "Bairro" in Brazil, "Prefecture" in Japan.
 */
export function addressLabel(
  field: AddressField | "country",
  format: ResolvedAddressFormat,
  index?: number,
): string;
