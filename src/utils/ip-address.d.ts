export type IPAddressKind = "address" | "cidr" | "range";

export type IPAddressError = {
  /**
   * Stable id of the failure, for example `"octet-too-large"` or
   * `"host-bits"`. Use it to translate the message.
   */
  code: string;
  /** English message that names the problem and, where it can, the fix. */
  message: string;
  /** The values the message names, such as `{ octet: 3 }`. */
  params: Record<string, string | number>;
};

export type ParsedIPAddress = {
  kind: IPAddressKind;
  version: 4 | 6;
  /**
   * Canonical text of the address. For a CIDR block it is the address as
   * written (the network address, unless `hostBits` is `"allow"`); for a
   * range it is the first address.
   */
  address: string;
  /** Prefix length of a CIDR block, otherwise `null`. */
  prefix: number | null;
  /** First address of the block, range, or the address itself. */
  start: bigint;
  /** Last address of the block, range, or the address itself. */
  end: bigint;
  /** Number of addresses from `start` to `end`. */
  size: bigint;
  /** Port of a `host:port` pair, otherwise `null`. */
  port: number | null;
  /** IPv6 zone identifier (`eth0` in `fe80::1%eth0`), otherwise `null`. */
  zone: string | null;
  /** `true` when a CIDR block kept host bits (`hostBits: "allow"`). */
  hostBitsSet: boolean;
  /** Canonical text of the whole value, such as `2001:db8::/32`. */
  text: string;
};

export type ParseIPAddressOptions = {
  /**
   * Forms to accept.
   * @default ["address"]
   */
  allow?: IPAddressKind[];
  /**
   * Require one IP version.
   * @default "any"
   */
  version?: "any" | 4 | 6;
  /**
   * Accept `1.2.3.4:8080` and `[::1]:443`.
   * @default false
   */
  port?: boolean;
  /**
   * Accept an IPv6 zone identifier (`fe80::1%eth0`).
   * @default false
   */
  zone?: boolean;
  /**
   * `"error"` rejects `010.0.0.1`, which some systems read as octal.
   * `"strip"` reads the octet as decimal.
   * @default "error"
   */
  leadingZeros?: "error" | "strip";
  /**
   * What a CIDR block with host bits set (`10.0.0.5/24`) does: `"error"`
   * suggests the network address, `"mask"` rewrites it to the network
   * address, `"allow"` keeps the address (an interface address).
   * @default "error"
   */
  hostBits?: "error" | "mask" | "allow";
  /** Shortest prefix length (largest block) a CIDR block may have. */
  minPrefix?: number;
  /** Longest prefix length (smallest block) a CIDR block may have. */
  maxPrefix?: number;
  /**
   * The value must sit inside at least one of these (CIDR blocks, ranges or
   * addresses). Entries that don't parse are ignored.
   */
  within?: string | ParsedIPAddress | (string | ParsedIPAddress)[];
  /**
   * The value must not overlap any of these. Entries that don't parse are
   * ignored.
   */
  excludes?: string | ParsedIPAddress | (string | ParsedIPAddress)[];
};

export type IPAddressSpan = {
  /** Number of addresses. */
  size: bigint;
  /** First address. */
  first: string;
  /** Last address. */
  last: string;
  /** Network address of a CIDR block, otherwise `null`. */
  network: string | null;
  /** Broadcast address of an IPv4 CIDR block of /30 or larger, otherwise `null`. */
  broadcast: string | null;
  /** Number of addresses a host can use. */
  usable: bigint;
  /** First usable address. */
  firstUsable: string;
  /** Last usable address. */
  lastUsable: string;
};

/** Longest input the parser reads. */
export const MAX_LENGTH: number;

/**
 * Parse an IPv4 or IPv6 address, a CIDR block, a range, or a `host:port`.
 * Strict (RFC 4291, 4632 and 5952) and never throws.
 */
export function parseIPAddress(
  input: string,
  options?: ParseIPAddressOptions,
): { ok: true; value: ParsedIPAddress } | { ok: false; error: IPAddressError };

/** Canonical text of an address (RFC 5952 for IPv6). */
export function formatIPAddress(version: 4 | 6, value: bigint): string;

/** Parse constraint entries into values; entries that don't parse are skipped. */
export function resolveIPRanges(
  input:
    string | ParsedIPAddress | (string | ParsedIPAddress)[] | null | undefined,
): ParsedIPAddress[];

/**
 * Check a parsed value against `within` and `excludes`. Returns the error, or
 * `null` when the value passes.
 */
export function checkIPAddressBounds(
  value: ParsedIPAddress,
  bounds?: Pick<ParseIPAddressOptions, "within" | "excludes">,
): IPAddressError | null;

/** Whether `outer` holds every address in `inner`. */
export function ipRangeContains(
  outer: Pick<ParsedIPAddress, "version" | "start" | "end">,
  inner: Pick<ParsedIPAddress, "version" | "start" | "end">,
): boolean;

/** Whether two ranges share an address. */
export function ipRangesOverlap(
  a: Pick<ParsedIPAddress, "version" | "start" | "end">,
  b: Pick<ParsedIPAddress, "version" | "start" | "end">,
): boolean;

/** Size, bounds, network, broadcast and usable hosts of a parsed value. */
export function describeIPRange(parsed: ParsedIPAddress): IPAddressSpan;

/**
 * Tidy pasted or IME text before parsing: full-width characters, Unicode
 * dashes, invisible characters and bidi marks.
 */
export function cleanIPAddressText(text: string): string;
