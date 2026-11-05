// @vitest-environment node
import {
  getLocaleDirection,
  localeDirection,
} from "../../src/utils/locale-direction.js";

describe("localeDirection", () => {
  it.each([
    ["en-US", "ltr"],
    ["ja", "ltr"],
    ["ar", "rtl"],
    ["ar-EG", "rtl"],
    ["ar-u-nu-latn", "rtl"],
    ["fa", "rtl"],
    ["he", "rtl"],
    ["ur", "rtl"],
    ["pa-Arab", "rtl"],
    ["pa", "ltr"],
  ])("%s is %s", (locale, expected) => {
    expect(localeDirection(locale)).toBe(expected);
  });

  it("resolves undefined to the runtime's default locale", () => {
    const runtime = new Intl.NumberFormat().resolvedOptions().locale;
    expect(localeDirection(undefined)).toBe(localeDirection(runtime));
  });
});

describe("getLocaleDirection", () => {
  it.each([
    ["en-US", "ltr"],
    ["ja-JP", "ltr"],
    ["ar", "rtl"],
    ["ar-EG", "rtl"],
    ["ar-EG-u-nu-latn", "rtl"],
    ["he-IL", "rtl"],
    ["fa", "rtl"],
    ["pa-Arab", "rtl"],
    ["pa", "ltr"],
    ["az-Arab", "rtl"],
    ["zh-Hant", "ltr"],
  ])("%s is %s", (locale, expected) => {
    expect(getLocaleDirection(locale)).toBe(expected);
  });

  it.each([undefined, "", "not_a_tag"])("reads %j as ltr", (locale) => {
    expect(getLocaleDirection(locale)).toBe("ltr");
  });
});
