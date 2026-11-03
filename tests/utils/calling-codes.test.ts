// @vitest-environment node
import {
  callingCode,
  regionsForCallingCode,
  splitCallingCode,
} from "../../src/utils/calling-codes.js";
import { listRegions } from "../../src/utils/intl-display-names.js";

describe("callingCode", () => {
  it.each([
    ["US", "1"],
    ["CA", "1"],
    ["GB", "44"],
    ["CH", "41"],
    ["IN", "91"],
    ["ch", "41"],
    ["XK", "383"],
    ["BV", ""],
    ["ZZ", ""],
  ])("%s is +%s", (region, code) => {
    expect(callingCode(region)).toBe(code);
  });

  it("covers every listed region but the few with no calling code", () => {
    const without = listRegions().filter((region) => !callingCode(region));

    expect(without.sort()).toEqual(["BV", "HM"]);
  });
});

describe("regionsForCallingCode", () => {
  it("lists the main region first", () => {
    expect(regionsForCallingCode("1").slice(0, 2)).toEqual(["US", "CA"]);
    expect(regionsForCallingCode("7")).toEqual(["RU", "KZ"]);
    expect(regionsForCallingCode("41")).toEqual(["CH"]);
    expect(regionsForCallingCode("999")).toEqual([]);
  });

  it("gives each region one code", () => {
    const seen = new Map<string, string>();
    for (const region of listRegions()) {
      const code = callingCode(region);
      if (!code) continue;
      expect(regionsForCallingCode(code)).toContain(region);
      expect(seen.has(region)).toBe(false);
      seen.set(region, code);
    }
  });
});

describe("splitCallingCode", () => {
  it.each([
    ["4155550100", "41", "55550100"],
    ["14155550100", "1", "4155550100"],
    ["442071234567", "44", "2071234567"],
    ["38343123456", "383", "43123456"],
  ])("splits %s", (digits, code, rest) => {
    expect(splitCallingCode(digits)).toEqual({ code, rest });
  });

  it("finds no calling code in digits that start none", () => {
    expect(splitCallingCode("")).toBeNull();
    expect(splitCallingCode("0123")).toBeNull();
  });

  it("is prefix-free: no code starts another", () => {
    const codes = [...new Set(listRegions().map(callingCode).filter(Boolean))];
    for (const code of codes) {
      for (const other of codes) {
        if (code !== other) expect(other.startsWith(code)).toBe(false);
      }
    }
  });
});
