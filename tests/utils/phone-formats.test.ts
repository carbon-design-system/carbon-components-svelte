// @vitest-environment node
import { createMask } from "../../src/utils/input-mask.js";
import {
  parseInternational,
  phoneFormat,
} from "../../src/utils/phone-formats.js";

describe("phoneFormat", () => {
  it("gives every country with +1 the North American format", () => {
    expect(phoneFormat("US").pattern).toBe("(999) 999-9999");
    expect(phoneFormat("JM")).toEqual(phoneFormat("CA"));
  });

  it.each([
    ["GB", "2079460958", "020 7946 0958"],
    ["FR", "612345678", "06 12 34 56 78"],
    ["JP", "9012345678", "090-1234-5678"],
    ["DE", "3012345678", "030 12345678"],
    ["BR", "11912345678", "(11) 91234-5678"],
  ])("%s writes %s as %s", (region, digits, text) => {
    expect(createMask(phoneFormat(region).pattern).format(digits).value).toBe(
      text,
    );
  });

  it("reads a typed trunk prefix as part of the format", () => {
    const mask = createMask(phoneFormat("GB").pattern);
    expect(mask.format("020 7946 0958").rawValue).toBe("2079460958");
  });

  it("groups by threes where a country has no entry, up to 15 digits with the code", () => {
    const format = phoneFormat("BT");
    expect(format.known).toBe(false);
    expect(format.max).toBe(15 - 3);
    expect(format.pattern.startsWith("999 999 999 999")).toBe(true);
  });

  it("knows the fewest digits of a country with varying lengths", () => {
    expect(phoneFormat("GB")).toMatchObject({ min: 9, max: 10 });
    expect(phoneFormat("FR")).toMatchObject({ min: 9, max: 9 });
  });

  it("never takes more than 15 digits", () => {
    for (const region of ["US", "GB", "DE", "BR", "IN", "CN", "AU", "ZZ"]) {
      expect(phoneFormat(region).max).toBeLessThanOrEqual(15);
    }
  });
});

describe("parseInternational", () => {
  it("splits a number written with a plus", () => {
    expect(parseInternational("+44 20 7946 0958")).toEqual({
      code: "44",
      digits: "2079460958",
    });
    expect(parseInternational(" +1 (415) 555-0123 ")).toEqual({
      code: "1",
      digits: "4155550123",
    });
  });

  it("is null without a plus or a known code", () => {
    expect(parseInternational("020 7946 0958")).toBeNull();
    expect(parseInternational("+999 1234")).toBeNull();
  });
});
