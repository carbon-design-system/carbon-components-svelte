// @ts-check

/**
 * Strict parser, validator and normalizer for IPv4 and IPv6 addresses, CIDR
 * blocks (RFC 4632, RFC 4291 section 2.3), address ranges and `host:port`
 * pairs. Pure and dependency free: no DOM, no locale, and it never throws.
 * Every loop is bounded by `MAX_LENGTH`, so hostile input costs the same as a
 * short address.
 *
 * Address math uses `BigInt` (Chrome 67, Firefox 68, Safari 14). The module
 * calls `BigInt()` instead of writing `0n` literals, so a bundler that targets
 * older syntax can still compile the file.
 */

/** Longest input the parser reads; a bracketed IPv6 range with zone ids fits. */
export const MAX_LENGTH = 512;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const SIXTEEN = BigInt(16);
const MASK_16 = BigInt(0xffff);
const THIRTY_TWO = BigInt(32);
const MASK_32 = BigInt(0xffffffff);
/** `::ffff:0:0/96`, the IPv4-mapped prefix, as the top 96 bits. */
const MAPPED_PREFIX = BigInt(0xffff);
/** `64:ff9b::/96`, the NAT64 well-known prefix, as the top 96 bits. */
const NAT64_PREFIX = BigInt(0x0064ff9b) << BigInt(64);

/** @param {number} version */
const bitsOf = (version) => (version === 4 ? 32 : 128);

/**
 * English defaults for every error code. A consumer's `translateWithId`
 * replaces them; the parser always returns the code and its values.
 * @type {Record<string, (p: Record<string, string | number>) => string>}
 */
const MESSAGES = {
  empty: () => "Enter an IP address",
  "too-long": (p) => `Too long: at most ${p.max} characters`,
  "invalid-char": (p) => `Unexpected character ${p.char}`,
  "octet-count": (p) => `An IPv4 address has 4 octets, found ${p.found}`,
  "octet-empty": (p) => `Octet ${p.octet} is empty`,
  "octet-char": (p) => `Octet ${p.octet} has an unexpected character ${p.char}`,
  "octet-too-large": (p) => `Octet ${p.octet} is greater than 255`,
  "octet-leading-zero": (p) =>
    `Octet ${p.octet} has a leading zero ("${p.value}"), which some systems read as octal. Use "${p.suggestion}"`,
  "v6-triple-colon": () => "Too many colons in a row",
  "v6-multiple-compression": () => 'An IPv6 address can use "::" only once',
  "v6-too-many": () => "Too many groups: an IPv6 address has 8",
  "v6-compression-empty": () =>
    'Too many groups: "::" has to stand for at least one group of zeros',
  "v6-too-few": (p) =>
    `Too few groups: found ${p.found} of ${p.expected}. Use "::" for a run of zeros`,
  "v6-group-empty": (p) => `Group ${p.group} is empty`,
  "v6-group-too-long": (p) => `Group ${p.group} has more than 4 hex digits`,
  "v6-group-char": (p) =>
    `Group ${p.group} has an unexpected character ${p.char}`,
  "v6-leading-colon": () => 'An IPv6 address can\'t start with a single ":"',
  "v6-trailing-colon": () => 'An IPv6 address can\'t end with a single ":"',
  "v6-ipv4-position": () => "An embedded IPv4 address must come last",
  "v6-zone-unsupported": () => "Zone identifiers (%eth0) aren't supported here",
  "v6-zone-invalid": () =>
    "A zone identifier can use letters, digits, and . _ ~ - only",
  "prefix-missing": () => 'Enter a prefix length after "/"',
  "prefix-invalid": () => "A prefix length is a whole number",
  "prefix-leading-zero": (p) =>
    `Prefix length ${p.value} has a leading zero. Use ${p.suggestion}`,
  "prefix-netmask": (p) =>
    p.suggestion
      ? `Use a prefix length, not a netmask: ${p.suggestion}`
      : "Use a prefix length such as /24, not a netmask",
  "prefix-too-large": (p) => `Prefix length is greater than ${p.max}`,
  "prefix-below-min": (p) => `Prefix length must be at least /${p.min}`,
  "prefix-above-max": (p) => `Prefix length must be at most /${p.max}`,
  "host-bits": (p) => `Host bits set: did you mean ${p.suggestion}?`,
  "range-format": () => "A range has one hyphen, as in 10.0.0.1-10.0.0.50",
  "range-incomplete": () => "Enter the other end of the range",
  "range-version-mismatch": () =>
    "Both ends of a range must be the same IP version",
  "range-order": (p) =>
    `The range ends (${p.end}) before it starts (${p.start})`,
  "port-unsupported": () => "Ports aren't supported here",
  "port-with-range": () => "A CIDR block or a range can't include a port",
  "port-invalid": () => "A port is a whole number",
  "port-out-of-range": () => "Port must be between 1 and 65535",
  "brackets-invalid": () => "Brackets must wrap the address, as in [::1]:443",
  "kind-not-allowed": (p) => `Enter ${p.allowed}`,
  "version-mismatch": (p) => `Enter an IPv${p.expected} address`,
  outside: (p) => `Must be inside ${p.against}`,
  overlaps: (p) => `Overlaps ${p.with}`,
};

/** @typedef {import("./ip-address.js").IPAddressError} IPAddressError */

/**
 * @param {string} code
 * @param {Record<string, string | number>} [params]
 * @returns {{ ok: false, error: IPAddressError }}
 */
function fail(code, params = {}) {
  const message = (MESSAGES[code] ?? (() => code))(params);
  return { ok: false, error: { code, message, params } };
}

/**
 * A character, quoted and made visible for a message. Controls and invisible
 * characters show as `U+XXXX`, since a pasted zero-width space prints as nothing.
 * @param {string} text
 * @param {number} index
 */
function quoteChar(text, index) {
  const point = text.codePointAt(index) ?? 0;
  const char = String.fromCodePoint(point);
  const visible = point > 0x20 && point < 0x7f;
  return visible
    ? `"${char}"`
    : `U+${point.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** @param {number} code */
const isDigit = (code) => code >= 48 && code <= 57;
/** @param {number} code */
const isHex = (code) =>
  isDigit(code) || (code >= 97 && code <= 102) || (code >= 65 && code <= 70);

/**
 * @typedef {{ ok: true, version: 4 | 6, value: bigint, zone: string | null }} HostResult
 */

/**
 * Dotted-decimal IPv4, as `inet_pton` reads it: exactly four decimal octets.
 * No `0x`, no short forms (`127.1`), no whole numbers (`2130706433`).
 * @param {string} text
 * @param {"error" | "strip"} leadingZeros
 * @returns {{ ok: true, value: number } | { ok: false, error: IPAddressError }}
 */
function parseV4(text, leadingZeros) {
  const parts = text.split(".");
  // "2130706433" and "127" are inet_aton forms; say how many octets, not "too large".
  if (parts.length === 1) return fail("octet-count", { found: 1 });
  let value = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const octet = i + 1;
    if (part === "") return fail("octet-empty", { octet });
    for (let c = 0; c < part.length; c++) {
      if (!isDigit(part.charCodeAt(c))) {
        return fail("octet-char", { octet, char: quoteChar(part, c) });
      }
    }
    if (
      part.length > 1 &&
      part.charCodeAt(0) === 48 &&
      leadingZeros === "error"
    ) {
      const suggestion = String(Number(part)).slice(0, 3);
      return fail("octet-leading-zero", { octet, value: part, suggestion });
    }
    // Four digits is already > 255 whatever the zeros; stop before Number().
    const n = part.length > 12 ? 999 : Number(part);
    if (n > 255) return fail("octet-too-large", { octet });
    if (i < 4) value = value * 256 + n;
  }
  if (parts.length !== 4) return fail("octet-count", { found: parts.length });
  return { ok: true, value };
}

/**
 * @param {string} text
 * @param {number} index
 * @returns {{ ok: true, value: number } | { ok: false, error: IPAddressError }}
 */
function parseGroup(text, index) {
  const group = index;
  if (text === "") return fail("v6-group-empty", { group });
  for (let c = 0; c < text.length; c++) {
    if (!isHex(text.charCodeAt(c))) {
      return fail("v6-group-char", { group, char: quoteChar(text, c) });
    }
  }
  if (text.length > 4) return fail("v6-group-too-long", { group });
  return { ok: true, value: Number.parseInt(text, 16) };
}

/**
 * RFC 4291 section 2.2 text forms: eight groups of one to four hex digits,
 * one `::` for one or more groups of zeros, and an optional IPv4 tail that
 * stands for the last two groups.
 * @param {string} input
 * @param {{ zone: boolean, leadingZeros: "error" | "strip" }} options
 * @returns {HostResult | { ok: false, error: IPAddressError }}
 */
function parseV6(input, options) {
  let text = input;
  /** @type {string | null} */
  let zone = null;

  const percent = text.indexOf("%");
  if (percent !== -1) {
    if (!options.zone) return fail("v6-zone-unsupported");
    zone = text.slice(percent + 1);
    text = text.slice(0, percent);
    if (zone === "") return fail("v6-zone-invalid");
    for (let c = 0; c < zone.length; c++) {
      const code = zone.charCodeAt(c);
      const ok =
        isDigit(code) ||
        (code >= 97 && code <= 122) ||
        (code >= 65 && code <= 90) ||
        code === 46 ||
        code === 95 ||
        code === 126 ||
        code === 45;
      if (!ok) return fail("v6-zone-invalid");
    }
  }

  if (text.includes(":::")) return fail("v6-triple-colon");

  let expected = 8;
  /** @type {number[]} */
  const tail = [];
  const lastColon = text.lastIndexOf(":");
  const dot = text.indexOf(".");
  if (dot !== -1) {
    if (dot < lastColon) return fail("v6-ipv4-position");
    const v4 = parseV4(text.slice(lastColon + 1), options.leadingZeros);
    if (!v4.ok) return v4;
    tail.push(Math.floor(v4.value / 65536), v4.value % 65536);
    // Keep both colons of a "::" that sits right before the IPv4 part.
    text = text.slice(
      0,
      text[lastColon - 1] === ":" ? lastColon + 1 : lastColon,
    );
    expected = 6;
  }

  const compression = text.indexOf("::");
  if (compression !== text.lastIndexOf("::")) {
    return fail("v6-multiple-compression");
  }

  /**
   * @param {string} part
   * @param {number} offset  groups before this part, for the message
   * @param {number[]} into
   */
  const readGroups = (part, offset, into) => {
    if (part === "") return null;
    const pieces = part.split(":");
    for (let i = 0; i < pieces.length; i++) {
      const g = parseGroup(pieces[i], offset + i + 1);
      if (!g.ok) return g;
      into.push(g.value);
    }
    return null;
  };

  /** @type {number[]} */
  const left = [];
  /** @type {number[]} */
  const right = [];
  /** @type {number[]} */
  let all;

  if (compression === -1) {
    if (text.startsWith(":") || (text === "" && tail.length > 0)) {
      return fail("v6-leading-colon");
    }
    if (text.endsWith(":")) return fail("v6-trailing-colon");
    const bad = readGroups(text, 0, left);
    if (bad) return bad;
    if (left.length > expected) return fail("v6-too-many");
    if (left.length < expected) {
      return fail("v6-too-few", {
        found: left.length + tail.length,
        expected: 8,
      });
    }
    all = left;
  } else {
    const before = text.slice(0, compression);
    const behind = text.slice(compression + 2);
    if (before.startsWith(":")) return fail("v6-leading-colon");
    if (behind.endsWith(":")) return fail("v6-trailing-colon");
    let bad = readGroups(before, 0, left);
    if (bad) return bad;
    bad = readGroups(behind, left.length, right);
    if (bad) return bad;
    // "::" stands for at least one group.
    const zeros = expected - left.length - right.length;
    if (zeros < 1) return fail("v6-compression-empty");
    all = [...left, ...new Array(zeros).fill(0), ...right];
  }

  let value = ZERO;
  for (const g of [...all, ...tail]) {
    value = (value << SIXTEEN) | BigInt(g);
  }
  return { ok: true, version: 6, value, zone };
}

/**
 * @param {string} text
 * @param {{ zone: boolean, leadingZeros: "error" | "strip" }} options
 * @returns {HostResult | { ok: false, error: IPAddressError }}
 */
function parseHost(text, options) {
  if (text.includes(":")) return parseV6(text, options);
  const v4 = parseV4(text, options.leadingZeros);
  if (!v4.ok) return v4;
  return { ok: true, version: 4, value: BigInt(v4.value), zone: null };
}

/**
 * @param {bigint} value  a 32-bit address
 * @returns {string}
 */
function dotted(value) {
  const n = Number(value);
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/**
 * Canonical text for an address (RFC 5952): lowercase, no leading zeros,
 * `::` for the longest run of two or more zero groups (the first on a tie),
 * and the mixed form for the IPv4-mapped and NAT64 well-known prefixes.
 * @param {4 | 6} version
 * @param {bigint} value
 * @returns {string}
 */
export function formatIPAddress(version, value) {
  if (version === 4) return dotted(value);

  const high = value >> THIRTY_TWO;
  const low = value & MASK_32;
  if (high === MAPPED_PREFIX) return `::ffff:${dotted(low)}`;
  if (high === NAT64_PREFIX) return `64:ff9b::${dotted(low)}`;

  /** @type {number[]} */
  const groups = [];
  for (let i = 7; i >= 0; i--) {
    groups.push(Number((value >> BigInt(i * 16)) & MASK_16));
  }

  // Longest run of zero groups; "::" never stands for a single group.
  let bestStart = -1;
  let bestLength = 0;
  for (let i = 0; i < 8;) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }
  if (bestLength < 2) bestStart = -1;

  const hex = (/** @type {number[]} */ list) =>
    list.map((g) => g.toString(16)).join(":");
  if (bestStart === -1) return hex(groups);
  return `${hex(groups.slice(0, bestStart))}::${hex(groups.slice(bestStart + bestLength))}`;
}

/**
 * Parse constraints written as strings into address values; entries that
 * don't parse are skipped.
 * @param {unknown} input  one string or parsed value, or a list of them
 * @returns {import("./ip-address.js").ParsedIPAddress[]}
 */
export function resolveIPRanges(input) {
  if (input == null) return [];
  const list = Array.isArray(input) ? input : [input];
  /** @type {import("./ip-address.js").ParsedIPAddress[]} */
  const out = [];
  for (const entry of list.slice(0, 1024)) {
    if (typeof entry === "string") {
      const result = parseIPAddress(entry, {
        allow: ["address", "cidr", "range"],
        hostBits: "allow",
        zone: false,
      });
      if (result.ok) out.push(result.value);
    } else if (
      entry &&
      typeof entry === "object" &&
      typeof entry.start === "bigint" &&
      typeof entry.end === "bigint"
    ) {
      out.push(entry);
    }
  }
  return out;
}

/**
 * Whether `outer` holds every address in `inner`. Different versions never do.
 * @param {{ version: 4 | 6, start: bigint, end: bigint }} outer
 * @param {{ version: 4 | 6, start: bigint, end: bigint }} inner
 */
export function ipRangeContains(outer, inner) {
  return (
    outer.version === inner.version &&
    outer.start <= inner.start &&
    inner.end <= outer.end
  );
}

/**
 * Whether two ranges share an address. Different versions never do.
 * @param {{ version: 4 | 6, start: bigint, end: bigint }} a
 * @param {{ version: 4 | 6, start: bigint, end: bigint }} b
 */
export function ipRangesOverlap(a, b) {
  return a.version === b.version && a.start <= b.end && b.start <= a.end;
}

/**
 * Check a parsed value against `within` and `excludes`. `parseIPAddress` runs
 * this last; call it alone to keep the parsed value of a block that fails, as
 * a form does to preview a CIDR block that is outside its VPC.
 * @param {import("./ip-address.js").ParsedIPAddress} value
 * @param {{ within?: unknown, excludes?: unknown }} [bounds]
 * @returns {IPAddressError | null}
 */
export function checkIPAddressBounds(value, bounds = {}) {
  const within = resolveIPRanges(bounds.within);
  if (
    within.length > 0 &&
    !within.some((outer) => ipRangeContains(outer, value))
  ) {
    return fail("outside", { against: within.map((r) => r.text).join(" or ") })
      .error;
  }
  for (const other of resolveIPRanges(bounds.excludes)) {
    if (ipRangesOverlap(other, value)) {
      return fail("overlaps", { with: other.text }).error;
    }
  }
  return null;
}

/** @param {string[]} allow */
function allowedText(allow) {
  const names = {
    address: "an IP address",
    cidr: "a CIDR block such as 10.0.0.0/24",
    range: "a range such as 10.0.0.1-10.0.0.50",
  };
  const list = allow.map((k) => names[/** @type {keyof typeof names} */ (k)]);
  if (list.length <= 1) return list[0] ?? names.address;
  return `${list.slice(0, -1).join(", ")} or ${list[list.length - 1]}`;
}

/**
 * Split a trailing `:port` off an address. Brackets wrap an IPv6 host.
 * A bare IPv6 address has no port: its last group would be ambiguous.
 * @param {string} text
 * @returns {{ ok: true, host: string, port: string | null, bracketed: boolean } | { ok: false, error: IPAddressError }}
 */
function splitPort(text) {
  if (text.startsWith("[")) {
    const close = text.indexOf("]");
    if (close === -1) return fail("brackets-invalid");
    const rest = text.slice(close + 1);
    if (rest === "") {
      return {
        ok: true,
        host: text.slice(1, close),
        port: null,
        bracketed: true,
      };
    }
    if (rest[0] !== ":") return fail("brackets-invalid");
    return {
      ok: true,
      host: text.slice(1, close),
      port: rest.slice(1),
      bracketed: true,
    };
  }
  const first = text.indexOf(":");
  if (first !== -1 && first === text.lastIndexOf(":") && text.includes(".")) {
    return {
      ok: true,
      host: text.slice(0, first),
      port: text.slice(first + 1),
      bracketed: false,
    };
  }
  return { ok: true, host: text, port: null, bracketed: false };
}

/**
 * @param {string} port
 * @returns {{ ok: true, value: number } | { ok: false, error: IPAddressError }}
 */
function parsePort(port) {
  if (port === "") return fail("port-invalid");
  for (let c = 0; c < port.length; c++) {
    if (!isDigit(port.charCodeAt(c))) return fail("port-invalid");
  }
  const n = port.length > 6 ? 999999 : Number(port);
  if (n < 1 || n > 65535) return fail("port-out-of-range");
  return { ok: true, value: n };
}

/**
 * Parse a netmask like `255.255.255.0` into a prefix length, or `null`.
 * @param {string} text
 */
function netmaskPrefix(text) {
  const v4 = parseV4(text, "error");
  if (!v4.ok) return null;
  const n = v4.value;
  let ones = 0;
  while (ones < 32 && (n >>> (31 - ones)) & 1) ones++;
  // The rest must be zeros.
  return ones === 32 || (n << ones) >>> 0 === 0 ? ones : null;
}

/**
 * Parse a prefix length. `max` is 32 or 128.
 * @param {string} text
 * @param {number} max
 * @param {"error" | "strip"} leadingZeros
 * @param {string} address  canonical network, for a netmask suggestion
 * @returns {{ ok: true, value: number } | { ok: false, error: IPAddressError }}
 */
function parsePrefix(text, max, leadingZeros, address) {
  if (text === "") return fail("prefix-missing");
  if (text.includes(".")) {
    const ones = netmaskPrefix(text);
    return fail("prefix-netmask", {
      suggestion: ones === null ? "" : `${address}/${ones}`,
    });
  }
  for (let c = 0; c < text.length; c++) {
    if (!isDigit(text.charCodeAt(c))) return fail("prefix-invalid");
  }
  if (
    text.length > 1 &&
    text.charCodeAt(0) === 48 &&
    leadingZeros === "error"
  ) {
    return fail("prefix-leading-zero", {
      value: text.slice(0, 8),
      suggestion: `/${Number(text.slice(0, 8))}`,
    });
  }
  const n = text.length > 6 ? 999999 : Number(text);
  if (n > max) return fail("prefix-too-large", { max });
  return { ok: true, value: n };
}

/**
 * @param {number} version
 * @param {bigint} value
 * @param {number} prefix
 */
function networkOf(version, value, prefix) {
  const hostBits = BigInt(bitsOf(version) - prefix);
  const mask = (ONE << hostBits) - ONE;
  return { start: value & ~mask, end: value | mask, hostBits: value & mask };
}

/**
 * Parse an address, CIDR block, range, or `host:port`.
 *
 * Never throws. Returns `{ ok: true, value }` with the canonical text and the
 * numeric range, or `{ ok: false, error }` with a code, an English message, and
 * the values the message names.
 *
 * @param {string} input
 * @param {import("./ip-address.js").ParseIPAddressOptions} [options]
 * @returns {{ ok: true, value: import("./ip-address.js").ParsedIPAddress } | { ok: false, error: IPAddressError }}
 */
export function parseIPAddress(input, options = {}) {
  const {
    allow = ["address"],
    version: wanted = "any",
    port: allowPort = false,
    zone: allowZone = false,
    leadingZeros = "error",
    hostBits = "error",
    minPrefix,
    maxPrefix,
  } = options;

  if (typeof input !== "string") return fail("empty");
  const text = input.trim();
  if (text === "") return fail("empty");
  if (text.length > MAX_LENGTH) return fail("too-long", { max: MAX_LENGTH });

  const hostOptions = { zone: allowZone, leadingZeros };
  const plain = { zone: false, leadingZeros };

  /** @type {Omit<import("./ip-address.js").ParsedIPAddress, "text" | "address" | "size"> & { address: bigint }} */
  let parsed;
  /** @type {"address" | "cidr" | "range"} */
  let kind;
  let canonical = "";

  const slash = text.indexOf("/");
  let hyphen = text.includes("%") ? -1 : text.indexOf("-");

  // Without ranges, a hyphen is a range only when both sides are addresses;
  // otherwise it is a typo in an address and gets that address's message.
  if (hyphen !== -1 && slash === -1 && !allow.includes("range")) {
    const sides = [text.slice(0, hyphen), text.slice(hyphen + 1)];
    if (!sides.every((side) => parseHost(side.trim(), plain).ok)) hyphen = -1;
  }

  if (hyphen !== -1 && slash === -1) {
    kind = "range";
    if (!allow.includes("range")) {
      return fail("kind-not-allowed", { kind, allowed: allowedText(allow) });
    }
    if (hyphen !== text.lastIndexOf("-")) return fail("range-format");
    const a = text.slice(0, hyphen).trim();
    const b = text.slice(hyphen + 1).trim();
    if (a === "" || b === "") return fail("range-incomplete");
    for (const side of [a, b]) {
      if (
        side.startsWith("[") ||
        (side.includes(".") && side.split(":").length === 2)
      ) {
        return fail("port-with-range");
      }
    }
    const left = parseHost(a, plain);
    if (!left.ok) return left;
    const right = parseHost(b, plain);
    if (!right.ok) return right;
    if (left.version !== right.version) return fail("range-version-mismatch");
    if (right.value < left.value) {
      return fail("range-order", {
        start: formatIPAddress(left.version, left.value),
        end: formatIPAddress(right.version, right.value),
      });
    }
    parsed = {
      kind,
      version: left.version,
      address: left.value,
      prefix: null,
      start: left.value,
      end: right.value,
      port: null,
      zone: null,
      hostBitsSet: false,
    };
    canonical = `${formatIPAddress(left.version, left.value)}-${formatIPAddress(right.version, right.value)}`;
  } else if (slash >= 0) {
    kind = "cidr";
    if (!allow.includes("cidr"))
      return fail("kind-not-allowed", { kind, allowed: allowedText(allow) });
    if (slash !== text.lastIndexOf("/"))
      return fail("invalid-char", { char: '"/"' });
    const hostText = text.slice(0, slash).trim();
    if (
      hostText.startsWith("[") ||
      (hostText.includes(".") && hostText.split(":").length === 2)
    ) {
      return fail("port-with-range");
    }
    if (hostText === "") return fail("empty");
    const host = parseHost(hostText, plain);
    if (!host.ok) return host;
    const prefix = parsePrefix(
      text.slice(slash + 1).trim(),
      bitsOf(host.version),
      leadingZeros,
      formatIPAddress(host.version, host.value),
    );
    if (!prefix.ok) return prefix;
    if (minPrefix != null && prefix.value < minPrefix)
      return fail("prefix-below-min", { min: minPrefix });
    if (maxPrefix != null && prefix.value > maxPrefix)
      return fail("prefix-above-max", { max: maxPrefix });

    const net = networkOf(host.version, host.value, prefix.value);
    const hasHostBits = net.hostBits !== ZERO;
    let address = host.value;
    if (hasHostBits) {
      if (hostBits === "error") {
        return fail("host-bits", {
          suggestion: `${formatIPAddress(host.version, net.start)}/${prefix.value}`,
        });
      }
      if (hostBits === "mask") address = net.start;
    }
    parsed = {
      kind,
      version: host.version,
      address,
      prefix: prefix.value,
      start: net.start,
      end: net.end,
      port: null,
      zone: null,
      hostBitsSet: hasHostBits && hostBits === "allow",
    };
    canonical = `${formatIPAddress(host.version, address)}/${prefix.value}`;
  } else {
    kind = "address";
    const split = splitPort(text);
    if (!split.ok) return split;
    if ((split.bracketed || split.port !== null) && !allowPort) {
      return fail(
        split.port !== null || split.bracketed
          ? "port-unsupported"
          : "invalid-char",
      );
    }
    const host = parseHost(split.host, hostOptions);
    if (!host.ok) return host;
    if (split.bracketed && host.version !== 6) return fail("brackets-invalid");
    /** @type {number | null} */
    let port = null;
    if (split.port !== null) {
      const p = parsePort(split.port);
      if (!p.ok) return p;
      port = p.value;
    }
    parsed = {
      kind,
      version: host.version,
      address: host.value,
      prefix: null,
      start: host.value,
      end: host.value,
      port,
      zone: host.zone,
      hostBitsSet: false,
    };
    const base =
      formatIPAddress(host.version, host.value) +
      (host.zone ? `%${host.zone}` : "");
    canonical =
      port === null
        ? base
        : host.version === 6
          ? `[${base}]:${port}`
          : `${base}:${port}`;
  }

  if (!allow.includes(kind)) {
    return fail("kind-not-allowed", { kind, allowed: allowedText(allow) });
  }
  if (wanted !== "any" && parsed.version !== wanted) {
    return fail("version-mismatch", { expected: wanted });
  }

  /** @type {import("./ip-address.js").ParsedIPAddress} */
  const value = {
    ...parsed,
    address: formatIPAddress(parsed.version, parsed.address),
    size: parsed.end - parsed.start + ONE,
    text: canonical,
  };

  const bounds = checkIPAddressBounds(value, options);
  if (bounds) return { ok: false, error: bounds };

  return { ok: true, value };
}

/**
 * Describe the span of a parsed CIDR block, range or address. A CIDR block
 * also names its network and broadcast addresses and the usable hosts between
 * them. IPv6 has no broadcast address, and an IPv4 /31 (RFC 3021) and /32 have
 * no network or broadcast address either.
 * @param {import("./ip-address.js").ParsedIPAddress} parsed
 * @returns {import("./ip-address.js").IPAddressSpan}
 */
export function describeIPRange(parsed) {
  const { version, start, end, size, kind, prefix } = parsed;
  const fmt = (/** @type {bigint} */ n) => formatIPAddress(version, n);
  const subnet =
    kind === "cidr" && version === 4 && prefix !== null && prefix <= 30;
  const first = start + (subnet ? ONE : ZERO);
  const last = end - (subnet ? ONE : ZERO);
  return {
    size,
    first: fmt(start),
    last: fmt(end),
    network: kind === "cidr" ? fmt(start) : null,
    broadcast: subnet ? fmt(end) : null,
    usable: subnet ? size - BigInt(2) : size,
    firstUsable: fmt(first),
    lastUsable: fmt(last),
  };
}

/**
 * Tidy text from a paste or an IME before parsing: Unicode compatibility
 * folding (full-width digits and punctuation from a CJK input method), an
 * ideographic full stop, Unicode dashes, and invisible characters (zero-width
 * spaces, and the bidi marks that text copied from a right-to-left page
 * carries). Returns long input as is, so the parser can say it is too long.
 * @param {string} text
 * @returns {string}
 */
export function cleanIPAddressText(text) {
  if (typeof text !== "string" || text.length > 2048) return text;
  return text
    .normalize("NFKC")
    .replace(/[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g, "")
    .replace(/。/g, ".")
    .replace(/[‐-―−﹘﹣]/g, "-")
    .trim();
}
