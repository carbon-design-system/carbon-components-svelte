import { getNumberFormatter } from "../../src/utils/intlFormatterCache.js";

describe("getNumberFormatter", () => {
  it("returns the same instance for identical locale and options", () => {
    const a = getNumberFormatter("en-US", { style: "percent" });
    const b = getNumberFormatter("en-US", { style: "percent" });

    expect(a).toBe(b);
  });

  it("returns different instances for different options", () => {
    const a = getNumberFormatter("en-US", { style: "percent" });
    const b = getNumberFormatter("en-US", { maximumFractionDigits: 2 });

    expect(a).not.toBe(b);
  });

  it("returns different instances for different locales", () => {
    const a = getNumberFormatter("en-US", {
      style: "currency",
      currency: "USD",
    });
    const b = getNumberFormatter("de-DE", {
      style: "currency",
      currency: "USD",
    });

    expect(a).not.toBe(b);
  });

  it("formats using the requested locale and options", () => {
    const formatter = getNumberFormatter("en-US", {
      style: "currency",
      currency: "USD",
    });

    expect(formatter.format(1234)).toBe("$1,234.00");
  });
});
