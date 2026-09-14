import {
  getDateTimeFormatter,
  getNumberFormatter,
  getRelativeTimeFormatter,
} from "../../src/utils/intl-formatter-cache.js";

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

describe("getRelativeTimeFormatter", () => {
  it("returns the same instance for identical locale and options", () => {
    const options = { numeric: "auto", style: "long" } as const;
    const a = getRelativeTimeFormatter("en", options);
    const b = getRelativeTimeFormatter("en", options);

    expect(a).toBe(b);
  });

  it("returns different instances for different options", () => {
    const a = getRelativeTimeFormatter("en", {
      numeric: "auto",
      style: "long",
    });
    const b = getRelativeTimeFormatter("en", {
      numeric: "always",
      style: "long",
    });

    expect(a).not.toBe(b);
  });

  it("returns different instances for different locales", () => {
    const options = { numeric: "auto", style: "long" } as const;
    const a = getRelativeTimeFormatter("en", options);
    const b = getRelativeTimeFormatter("fr", options);

    expect(a).not.toBe(b);
  });
});

describe("getDateTimeFormatter", () => {
  it("returns the same instance for identical locale and options", () => {
    const options = { dateStyle: "medium", timeStyle: "short" } as const;
    const a = getDateTimeFormatter("en", options);
    const b = getDateTimeFormatter("en", options);

    expect(a).toBe(b);
  });

  it("returns different instances for different options", () => {
    const a = getDateTimeFormatter("en", { dateStyle: "medium" });
    const b = getDateTimeFormatter("en", { dateStyle: "full" });

    expect(a).not.toBe(b);
  });

  it("returns different instances for different locales", () => {
    const options = { dateStyle: "medium", timeStyle: "short" } as const;
    const a = getDateTimeFormatter("en", options);
    const b = getDateTimeFormatter("fr", options);

    expect(a).not.toBe(b);
  });
});
