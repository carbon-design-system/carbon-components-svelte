// @vitest-environment node
import { isIP } from "node:net";
import {
  cleanIPAddressText,
  describeIPRange,
  formatIPAddress,
  ipRangeContains,
  ipRangesOverlap,
  MAX_LENGTH,
  parseIPAddress,
  type ParseIPAddressOptions,
  resolveIPRanges,
} from "../../src/utils/ip-address.js";

const ALL: ParseIPAddressOptions = {
  allow: ["address", "cidr", "range"],
  port: true,
  zone: true,
};

function parse(text: string, options: ParseIPAddressOptions = ALL) {
  const result = parseIPAddress(text, options);
  if (!result.ok) throw new Error(`${text}: ${result.error.message}`);
  return result.value;
}

function code(text: string, options: ParseIPAddressOptions = ALL) {
  const result = parseIPAddress(text, options);
  return result.ok ? "ok" : result.error.code;
}

describe("canonical IPv6 (RFC 5952)", () => {
  // Section 4 examples, plus the placement rules of 4.2.
  it.each([
    ["2001:0db8::0001", "2001:db8::1"],
    ["2001:db8:0:0:0:0:2:1", "2001:db8::2:1"],
    ["2001:db8::0:1", "2001:db8::1"],
    ["2001:db8:0:1:1:1:1:1", "2001:db8:0:1:1:1:1:1"],
    ["2001:db8::1:1:1:1:1", "2001:db8:0:1:1:1:1:1"],
    ["2001:0:0:1:0:0:0:1", "2001:0:0:1::1"],
    ["2001:db8:0:0:1:0:0:1", "2001:db8::1:0:0:1"],
    ["2001:DB8::ABCD", "2001:db8::abcd"],
    ["0:0:0:0:0:0:0:0", "::"],
    ["0:0:0:0:0:0:0:1", "::1"],
    ["1:0:0:0:0:0:0:0", "1::"],
    ["1:0:0:0:0:0:0:1", "1::1"],
    ["1:2:3:4:5:6:7:8", "1:2:3:4:5:6:7:8"],
    ["1:0:3:4:5:6:7:8", "1:0:3:4:5:6:7:8"],
    ["1:2:3:4:5:6:7:0", "1:2:3:4:5:6:7:0"],
    ["0:2:3:4:5:6:7:8", "0:2:3:4:5:6:7:8"],
    ["::0:0", "::"],
    ["00000::", null],
  ])("%s becomes %s", (input, expected) => {
    if (expected === null) return expect(code(input)).not.toBe("ok");
    expect(parse(input).text).toBe(expected);
  });

  // Section 5: mixed notation for well-known prefixes only.
  it.each([
    ["::ffff:192.0.2.1", "::ffff:192.0.2.1"],
    ["0:0:0:0:0:ffff:192.0.2.1", "::ffff:192.0.2.1"],
    ["::ffff:c000:201", "::ffff:192.0.2.1"],
    ["64:ff9b::192.0.2.33", "64:ff9b::192.0.2.33"],
    ["64:ff9b::c000:221", "64:ff9b::192.0.2.33"],
    ["::1.2.3.4", "::102:304"],
    ["2001:db8::1.2.3.4", "2001:db8::102:304"],
    ["1:2:3:4:5:6:1.2.3.4", "1:2:3:4:5:6:102:304"],
  ])("%s becomes %s", (input, expected) => {
    expect(parse(input).text).toBe(expected);
  });

  it("agrees with the WHATWG URL serializer for non-embedded addresses", () => {
    let seed = 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    };
    for (let i = 0; i < 2000; i++) {
      // Few distinct values, so runs of zeros are common.
      const groups = Array.from({ length: 8 }, () =>
        next() % 3 === 0 ? (next() % 0x10000).toString(16) : "0",
      );
      const text = groups.join(":");
      const value = parse(text);
      const host = new URL(`http://[${text}]/`).hostname.slice(1, -1);
      if (/^::ffff:/.test(value.text) || value.text.startsWith("64:ff9b::")) {
        continue;
      }
      expect(value.text, text).toBe(host);
      // Idempotent.
      expect(parse(value.text).text).toBe(value.text);
    }
  });
});

describe("IPv4", () => {
  it("parses dotted decimal", () => {
    const v = parse("192.168.1.255");
    expect(v.version).toBe(4);
    expect(v.start).toBe(BigInt(0xc0a801ff));
    expect(v.size).toBe(BigInt(1));
    expect(v.kind).toBe("address");
  });

  it.each([
    ["1.2.3", "octet-count"],
    ["1.2.3.4.5", "octet-count"],
    ["1.2.3.", "octet-empty"],
    [".1.2.3", "octet-empty"],
    ["1..2.3", "octet-empty"],
    ["256.0.0.1", "octet-too-large"],
    ["1.2.3.999", "octet-too-large"],
    ["1.2.3.1234", "octet-too-large"],
    ["1.2.3.99999999999999999999", "octet-too-large"],
    ["01.2.3.4", "octet-leading-zero"],
    ["1.2.3.00", "octet-leading-zero"],
    ["0x7f.0.0.1", "octet-char"],
    ["1.2.3.4a", "octet-char"],
    ["+1.2.3.4", "octet-char"],
    ["1.-2.3.4", "octet-empty"],
    ["2130706433", "octet-count"],
    ["127.1", "octet-count"],
    ["", "empty"],
    ["   ", "empty"],
  ])("rejects %s with %s", (input, expected) => {
    expect(code(input)).toBe(expected);
  });

  it("names the octet in the message", () => {
    const result = parseIPAddress("10.0.256.1");
    expect(result.ok ? "" : result.error.message).toBe(
      "Octet 3 is greater than 255",
    );
    expect(result.ok ? 0 : result.error.params.octet).toBe(3);
  });

  it("explains a leading zero and suggests the decimal octet", () => {
    const result = parseIPAddress("10.0.010.1");
    expect(result.ok ? "" : result.error.message).toContain('Use "10"');
  });

  it("reads leading zeros as decimal on request", () => {
    expect(parse("010.000.001.002", { leadingZeros: "strip" }).text).toBe(
      "10.0.1.2",
    );
    expect(parse("010.8.0.010", { leadingZeros: "strip" }).start).toBe(
      BigInt(10 * 2 ** 24 + 8 * 2 ** 16 + 10),
    );
  });

  it("agrees with node:net on which strings are addresses", () => {
    const alphabet = ["0", "1", "2", "5", "9", "00", "01", "255", "256", "."];
    let seed = 11;
    const next = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    };
    for (let i = 0; i < 5000; i++) {
      const length = 1 + (next() % 9);
      const text = Array.from(
        { length },
        () => alphabet[next() % alphabet.length],
      ).join("");
      const node = isIP(text) === 4;
      expect(code(text) === "ok", text).toBe(node);
    }
  });
});

describe("IPv6", () => {
  it.each([
    "::",
    "::1",
    "1::",
    "1::2",
    "1:2:3:4:5:6:7:8",
    "1:2:3:4:5:6:7::",
    "::2:3:4:5:6:7:8",
    "1:2:3:4:5:6:1.2.3.4",
    "::1.2.3.4",
    "::ffff:1.2.3.4",
    "FEDC:BA98:7654:3210:FEDC:BA98:7654:3210",
    "1080::8:800:200C:417A",
    "ffff:ffff:ffff:ffff:ffff:ffff:255.255.255.255",
  ])("accepts %s", (input) => {
    expect(code(input)).toBe("ok");
  });

  it.each([
    [":", "v6-leading-colon"],
    [":::", "v6-triple-colon"],
    ["1:::2", "v6-triple-colon"],
    ["1::2::3", "v6-multiple-compression"],
    ["::1::", "v6-multiple-compression"],
    [":1:2:3:4:5:6:7", "v6-leading-colon"],
    ["1:2:3:4:5:6:7:", "v6-trailing-colon"],
    ["1::2:", "v6-trailing-colon"],
    [":1::2", "v6-leading-colon"],
    ["1:2:3:4:5:6:7", "v6-too-few"],
    ["1:2:3:4:5:6:7:8:9", "v6-too-many"],
    ["1:2:3:4:5:6:7::8", "v6-compression-empty"],
    ["1:2:3:4:5:6:7:8::", "v6-compression-empty"],
    ["12345::", "v6-group-too-long"],
    ["1:2:3:4:5:6:7:00000", "v6-group-too-long"],
    ["g::1", "v6-group-char"],
    ["1: 2::3", "v6-group-char"],
    ["1::2:", "v6-trailing-colon"],
    ["1.2.3.4::", "v6-ipv4-position"],
    ["1.2.3.4:1::", "v6-ipv4-position"],
    ["::1.2.3", "octet-count"],
    ["::1.2.3.256", "octet-too-large"],
    ["::01.2.3.4", "octet-leading-zero"],
    ["1:2:3:4:5:6:7:1.2.3.4", "v6-too-many"],
    ["1:2:3:4:5:1.2.3.4", "v6-too-few"],
  ])("rejects %s with %s", (input, expected) => {
    expect(code(input)).toBe(expected);
  });

  it("names the group in the message", () => {
    const result = parseIPAddress("2001:db8:12345::1");
    expect(result.ok ? "" : result.error.message).toBe(
      "Group 3 has more than 4 hex digits",
    );
  });

  it("agrees with node:net on which strings are addresses", () => {
    const alphabet = ["0", "1", "a", "F", "ffff", "10000", ":", ":", "::", "."];
    let seed = 23;
    const next = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    };
    let agree = 0;
    for (let i = 0; i < 20000; i++) {
      const length = 1 + (next() % 12);
      const text = Array.from(
        { length },
        () => alphabet[next() % alphabet.length],
      ).join("");
      const node = isIP(text) === 6;
      expect(code(text) === "ok", text).toBe(node);
      if (node) agree++;
    }
    // The generator has to reach valid addresses, or the loop proves little.
    expect(agree).toBeGreaterThan(20);
  });

  it("round-trips every shape of zero run", () => {
    for (let mask = 0; mask < 256; mask++) {
      const groups = Array.from({ length: 8 }, (_, i) =>
        mask & (1 << i) ? "0" : (i + 1).toString(16),
      );
      const value = parse(groups.join(":"));
      expect(parse(value.text).start).toBe(value.start);
      expect(parse(value.text).text).toBe(value.text);
    }
  });

  it("keeps the full 128-bit value", () => {
    const v = parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    expect(v.start).toBe((BigInt(1) << BigInt(128)) - BigInt(1));
    expect(formatIPAddress(6, v.start)).toBe(
      "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
    );
  });

  describe("zone identifiers", () => {
    it("accepts a zone when asked and keeps its case", () => {
      const v = parse("FE80::1%Eth0");
      expect(v.text).toBe("fe80::1%Eth0");
      expect(v.zone).toBe("Eth0");
    });

    it("rejects a zone by default", () => {
      expect(code("fe80::1%eth0", {})).toBe("v6-zone-unsupported");
    });

    it.each(["fe80::1%", "fe80::1%eth 0", "fe80::1%e/th0", "fe80::1%eth0%1"])(
      "rejects the zone in %s",
      (input) => {
        expect(code(input)).not.toBe("ok");
      },
    );

    it("does not take a zone inside a CIDR block or a range", () => {
      expect(code("fe80::1%eth0/64")).toBe("v6-zone-unsupported");
      expect(code("fe80::1%eth0-fe80::2")).not.toBe("ok");
    });
  });
});

describe("CIDR (RFC 4632)", () => {
  it("reads the block", () => {
    const v = parse("10.0.0.0/24");
    expect(v).toMatchObject({
      kind: "cidr",
      version: 4,
      address: "10.0.0.0",
      prefix: 24,
      text: "10.0.0.0/24",
    });
    expect(v.size).toBe(BigInt(256));
    expect(v.end - v.start).toBe(BigInt(255));
  });

  it("handles the edges of the prefix range", () => {
    expect(parse("0.0.0.0/0").size).toBe(BigInt(2) ** BigInt(32));
    expect(parse("1.2.3.4/32").size).toBe(BigInt(1));
    expect(parse("::/0").size).toBe(BigInt(2) ** BigInt(128));
    expect(parse("::1/128").size).toBe(BigInt(1));
    expect(parse("2001:db8::/32").size).toBe(BigInt(2) ** BigInt(96));
  });

  it.each([
    ["10.0.0.0/33", "prefix-too-large"],
    ["::/129", "prefix-too-large"],
    ["10.0.0.0/", "prefix-missing"],
    ["10.0.0.0/-1", "prefix-invalid"],
    ["10.0.0.0/+8", "prefix-invalid"],
    ["10.0.0.0/8a", "prefix-invalid"],
    ["10.0.0.0/ 8", "ok"],
    ["10.0.0.0/08", "prefix-leading-zero"],
    ["10.0.0.0/8/8", "invalid-char"],
    ["/24", "empty"],
    ["10.0.0.0/99999999999", "prefix-too-large"],
  ])("rejects %s with %s", (input, expected) => {
    expect(code(input)).toBe(expected);
  });

  it("names the network when host bits are set", () => {
    const result = parseIPAddress("10.0.1.77/24", ALL);
    expect(result.ok ? "" : result.error.message).toBe(
      "Host bits set: did you mean 10.0.1.0/24?",
    );
    expect(code("2001:db8::1/32")).toBe("host-bits");
  });

  it("masks or keeps host bits on request", () => {
    expect(
      parse("10.0.1.77/24", { allow: ["cidr"], hostBits: "mask" }).text,
    ).toBe("10.0.1.0/24");
    const kept = parse("10.0.1.77/24", { allow: ["cidr"], hostBits: "allow" });
    expect(kept.text).toBe("10.0.1.77/24");
    expect(kept.address).toBe("10.0.1.77");
    expect(kept.hostBitsSet).toBe(true);
    expect(kept.start).toBe(parse("10.0.1.0/24").start);
  });

  it("explains a netmask", () => {
    const result = parseIPAddress("10.0.0.0/255.255.255.0", ALL);
    expect(result.ok ? "" : result.error.message).toContain("10.0.0.0/24");
    expect(code("10.0.0.0/255.0.255.0")).toBe("prefix-netmask");
  });

  it("limits the prefix length", () => {
    const options = { allow: ["cidr" as const], minPrefix: 16, maxPrefix: 28 };
    expect(code("10.0.0.0/16", options)).toBe("ok");
    expect(code("10.0.0.0/28", options)).toBe("ok");
    expect(code("10.0.0.0/15", options)).toBe("prefix-below-min");
    expect(code("10.0.0.0/29", options)).toBe("prefix-above-max");
  });

  it("does not take a port", () => {
    expect(code("10.0.0.0:80/24")).toBe("port-with-range");
  });
});

describe("describeIPRange", () => {
  it("names the network, broadcast, and usable hosts of an IPv4 block", () => {
    expect(describeIPRange(parse("10.0.0.0/24"))).toEqual({
      size: BigInt(256),
      first: "10.0.0.0",
      last: "10.0.0.255",
      network: "10.0.0.0",
      broadcast: "10.0.0.255",
      usable: BigInt(254),
      firstUsable: "10.0.0.1",
      lastUsable: "10.0.0.254",
    });
  });

  it("treats /31 and /32 as RFC 3021 point-to-point and a single host", () => {
    expect(describeIPRange(parse("10.0.0.0/31"))).toMatchObject({
      broadcast: null,
      usable: BigInt(2),
      firstUsable: "10.0.0.0",
      lastUsable: "10.0.0.1",
    });
    expect(describeIPRange(parse("10.0.0.7/32"))).toMatchObject({
      broadcast: null,
      usable: BigInt(1),
    });
    expect(describeIPRange(parse("10.0.0.0/30")).usable).toBe(BigInt(2));
  });

  it("has no broadcast address in IPv6", () => {
    expect(describeIPRange(parse("2001:db8::/64"))).toMatchObject({
      first: "2001:db8::",
      last: "2001:db8::ffff:ffff:ffff:ffff",
      network: "2001:db8::",
      broadcast: null,
      usable: BigInt(2) ** BigInt(64),
    });
  });

  it("describes a range and an address", () => {
    expect(describeIPRange(parse("10.0.0.1-10.0.0.50"))).toMatchObject({
      size: BigInt(50),
      network: null,
      first: "10.0.0.1",
      last: "10.0.0.50",
    });
    expect(describeIPRange(parse("::1")).size).toBe(BigInt(1));
  });
});

describe("ranges", () => {
  it("normalizes spacing", () => {
    expect(parse("10.0.0.1 - 10.0.0.50").text).toBe("10.0.0.1-10.0.0.50");
    expect(parse("10.0.0.1-10.0.0.50").size).toBe(BigInt(50));
    expect(parse("::1-::ff").text).toBe("::1-::ff");
  });

  it("allows a range of one", () => {
    expect(parse("10.0.0.1-10.0.0.1").size).toBe(BigInt(1));
  });

  it.each([
    ["10.0.0.50-10.0.0.1", "range-order"],
    ["10.0.0.1-::2", "range-version-mismatch"],
    ["10.0.0.1-", "range-incomplete"],
    ["-10.0.0.1", "range-incomplete"],
    ["10.0.0.1-10.0.0.5-10.0.0.9", "range-format"],
    ["10.0.0.1-50", "octet-count"],
    ["10.0.0.1:80-10.0.0.9", "port-with-range"],
    ["[::1]-[::9]", "port-with-range"],
  ])("rejects %s with %s", (input, expected) => {
    expect(code(input)).toBe(expected);
  });
});

describe("ports", () => {
  it("reads IPv4 and bracketed IPv6", () => {
    expect(parse("1.2.3.4:8080")).toMatchObject({
      port: 8080,
      text: "1.2.3.4:8080",
    });
    expect(parse("[2001:DB8::1]:443").text).toBe("[2001:db8::1]:443");
    expect(parse("[::1]").text).toBe("::1");
    expect(parse("[::1]").port).toBeNull();
  });

  it("keeps a bare IPv6 address whole", () => {
    // Without brackets the last group is not a port.
    const v = parse("2001:db8::1:8080");
    expect(v.port).toBeNull();
    expect(v.text).toBe("2001:db8::1:8080");
  });

  it.each([
    ["1.2.3.4:0", "port-out-of-range"],
    ["1.2.3.4:65536", "port-out-of-range"],
    ["1.2.3.4:99999999999", "port-out-of-range"],
    ["1.2.3.4:", "port-invalid"],
    ["1.2.3.4:80a", "port-invalid"],
    ["[::1]x", "brackets-invalid"],
    ["[::1", "brackets-invalid"],
    ["[1.2.3.4]:80", "brackets-invalid"],
    ["[::1]:", "port-invalid"],
  ])("rejects %s with %s", (input, expected) => {
    expect(code(input)).toBe(expected);
  });

  it("names a bad port when ranges are off", () => {
    expect(code("1.2.3.4:-1", { port: true })).toBe("port-invalid");
  });

  it("is off by default", () => {
    expect(code("1.2.3.4:80", {})).toBe("port-unsupported");
    expect(code("[::1]:80", {})).toBe("port-unsupported");
  });

  it("strips leading zeros from a port", () => {
    expect(parse("1.2.3.4:0080").text).toBe("1.2.3.4:80");
  });
});

describe("allowed forms and versions", () => {
  it("rejects a form that is off, and says what to type", () => {
    const cidr = parseIPAddress("10.0.0.0/24", {});
    expect(cidr.ok ? "" : cidr.error.code).toBe("kind-not-allowed");
    expect(cidr.ok ? "" : cidr.error.message).toBe("Enter an IP address");

    const address = parseIPAddress("10.0.0.1", { allow: ["cidr"] });
    expect(address.ok ? "" : address.error.message).toBe(
      "Enter a CIDR block such as 10.0.0.0/24",
    );

    expect(code("10.0.0.1-10.0.0.2", { allow: ["address", "cidr"] })).toBe(
      "kind-not-allowed",
    );
  });

  it("pins the IP version", () => {
    expect(code("::1", { version: 4 })).toBe("version-mismatch");
    expect(code("1.2.3.4", { version: 6 })).toBe("version-mismatch");
    expect(code("10.0.0.0/8", { allow: ["cidr"], version: 4 })).toBe("ok");
    expect(code("::1", { version: 6 })).toBe("ok");
  });
});

describe("within and excludes", () => {
  it("accepts what sits inside, and says what is outside", () => {
    const options = { allow: ["cidr" as const], within: "10.0.0.0/16" };
    expect(code("10.0.9.0/24", options)).toBe("ok");
    expect(code("10.0.0.0/16", options)).toBe("ok");
    const outside = parseIPAddress("10.1.0.0/24", options);
    expect(outside.ok ? "" : outside.error.message).toBe(
      "Must be inside 10.0.0.0/16",
    );
    expect(code("10.0.0.0/15", options)).toBe("outside");
  });

  it("accepts any of several parents", () => {
    const options = {
      allow: ["cidr" as const],
      within: ["10.0.0.0/16", "192.168.0.0/16"],
    };
    expect(code("192.168.4.0/24", options)).toBe("ok");
    expect(code("172.16.0.0/24", options)).toBe("outside");
  });

  it("never holds an address of the other version", () => {
    expect(code("::1", { within: "10.0.0.0/8" })).toBe("outside");
    expect(code("10.0.0.1", { within: "::/0" })).toBe("outside");
  });

  it("rejects an overlap, partial or whole", () => {
    const options = { allow: ["cidr" as const], excludes: ["10.0.5.0/24"] };
    expect(code("10.0.4.0/24", options)).toBe("ok");
    expect(code("10.0.5.0/24", options)).toBe("overlaps");
    expect(code("10.0.5.128/25", options)).toBe("overlaps");
    expect(code("10.0.0.0/16", options)).toBe("overlaps");
    expect(code("2001:db8::/32", options)).toBe("ok");
    const result = parseIPAddress("10.0.5.0/25", options);
    expect(result.ok ? "" : result.error.message).toBe("Overlaps 10.0.5.0/24");
  });

  it("checks the whole range of a range value", () => {
    const options = { allow: ["range" as const], within: "10.0.0.0/24" };
    expect(code("10.0.0.5-10.0.0.9", options)).toBe("ok");
    expect(code("10.0.0.250-10.0.1.5", options)).toBe("outside");
  });

  it("ignores constraints that do not parse", () => {
    expect(code("10.0.0.1", { within: ["nope"] })).toBe("ok");
    expect(code("10.0.0.1", { excludes: ["nope", ""] })).toBe("ok");
  });

  it("measures containment and overlap", () => {
    const [a, b, c] = resolveIPRanges([
      "10.0.0.0/24",
      "10.0.0.128/25",
      "10.0.1.0/24",
    ]);
    expect(ipRangeContains(a, b)).toBe(true);
    expect(ipRangeContains(b, a)).toBe(false);
    expect(ipRangesOverlap(a, b)).toBe(true);
    expect(ipRangesOverlap(a, c)).toBe(false);
    // Adjacent blocks share no address.
    expect(ipRangesOverlap(a, c)).toBe(false);
  });
});

describe("cleanIPAddressText", () => {
  it("folds full-width characters from an input method", () => {
    const text = cleanIPAddressText("１０．０．０．１／２４");
    expect(text).toBe("10.0.0.1/24");
    expect(cleanIPAddressText("10。0。0。1")).toBe("10.0.0.1");
    expect(cleanIPAddressText("［：：１］：４４３")).toBe("[::1]:443");
  });

  it("maps Unicode dashes in a range pasted from a document", () => {
    for (const dash of ["‐", "‑", "‒", "–", "—", "−"]) {
      expect(parse(cleanIPAddressText(`10.0.0.1${dash}10.0.0.9`)).text).toBe(
        "10.0.0.1-10.0.0.9",
      );
    }
  });

  it("drops zero-width characters and bidi marks", () => {
    expect(cleanIPAddressText("‎10.0.0.1‏")).toBe("10.0.0.1");
    expect(cleanIPAddressText("‪2001:db8::1‬")).toBe("2001:db8::1");
    expect(cleanIPAddressText("10.0.​0.1﻿")).toBe("10.0.0.1");
    expect(cleanIPAddressText("10.0.0.1 ")).toBe("10.0.0.1");
  });

  it("leaves very long text for the parser to refuse", () => {
    const long = "1".repeat(5000);
    expect(cleanIPAddressText(long)).toBe(long);
  });

  it("names an invisible character in the error instead of printing nothing", () => {
    const result = parseIPAddress("10.0.​0.1");
    expect(result.ok ? "" : result.error.message).toContain("U+200B");
  });
});

describe("hostile input", () => {
  const PIECES = [
    "0",
    "1",
    "9",
    "a",
    "f",
    "F",
    "g",
    ".",
    ":",
    "::",
    "/",
    "-",
    "%",
    "[",
    "]",
    " ",
    "\t",
    "\n",
    "​",
    "\u0000",
    "\uD800",
    "\u{1F600}",
    "255",
    "256",
    "ffff",
    "eth0",
    "10.0.0.1",
    "::1",
    "/24",
    "/128",
    ":80",
  ];

  function random(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 2 ** 32;
    };
  }

  it("never throws and always returns a result or an error", () => {
    const rand = random(1);
    for (let i = 0; i < 40000; i++) {
      const length = Math.floor(rand() * 24);
      let text = "";
      for (let c = 0; c < length; c++) {
        text += PIECES[Math.floor(rand() * PIECES.length)];
      }
      const result = parseIPAddress(text, ALL);
      if (result.ok) {
        // A value always round-trips.
        const again = parseIPAddress(result.value.text, ALL);
        expect(again.ok, text).toBe(true);
        if (again.ok) expect(again.value.text).toBe(result.value.text);
      } else {
        expect(typeof result.error.code).toBe("string");
        expect(result.error.message.length).toBeGreaterThan(0);
        // A message never echoes more than a character of the input.
        expect(result.error.message.length).toBeLessThan(200);
      }
    }
  });

  it("answers random bytes", () => {
    const rand = random(2);
    for (let i = 0; i < 5000; i++) {
      let text = "";
      const length = Math.floor(rand() * 200);
      for (let c = 0; c < length; c++) {
        text += String.fromCharCode(Math.floor(rand() * 0x10000));
      }
      expect(() => parseIPAddress(text, ALL)).not.toThrow();
      expect(() => cleanIPAddressText(text)).not.toThrow();
    }
  });

  it("refuses text past the limit without reading it", () => {
    const result = parseIPAddress("1".repeat(10_000), ALL);
    expect(result.ok ? "" : result.error.code).toBe("too-long");
    const start = performance.now();
    for (const filler of [".", ":", "::", "-", "/", "1.", ":1", "[", "%"]) {
      const text = filler.repeat(10_000);
      expect(parseIPAddress(text, ALL).ok).toBe(false);
      expect(parseIPAddress(`${text}1`, ALL).ok).toBe(false);
    }
    expect(performance.now() - start).toBeLessThan(200);
  });

  it("stays linear on the longest legal input", () => {
    const edge = `${"1:".repeat(100)}1`.slice(0, MAX_LENGTH);
    const start = performance.now();
    for (let i = 0; i < 2000; i++) parseIPAddress(edge, ALL);
    for (let i = 0; i < 2000; i++) parseIPAddress(`${"1.".repeat(200)}1`, ALL);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("does not take a non-string", () => {
    for (const input of [null, undefined, 1, {}, [], Symbol.iterator]) {
      const result = parseIPAddress(input as unknown as string);
      expect(result.ok).toBe(false);
    }
  });

  it("parses 10,000 CIDR blocks in well under a second", () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      parseIPAddress(`10.${i % 256}.${(i >> 8) % 256}.0/24`, ALL);
    }
    expect(performance.now() - start).toBeLessThan(500);
  });
});
