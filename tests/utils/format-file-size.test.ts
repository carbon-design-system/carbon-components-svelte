import { formatFileSize } from "../../src/utils/format-file-size.js";

describe("formatFileSize", () => {
  test("formats bytes below one unit", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1000, { units: "binary" })).toBe("1000 B");
  });

  test("defaults to decimal units", () => {
    expect(formatFileSize(1000)).toBe("1 kB");
    expect(formatFileSize(1500)).toBe("1.5 kB");
    expect(formatFileSize(5_000_000)).toBe("5 MB");
    expect(formatFileSize(2e12)).toBe("2 TB");
  });

  test("formats binary units", () => {
    expect(formatFileSize(1024, { units: "binary" })).toBe("1 KiB");
    expect(formatFileSize(1536, { units: "binary" })).toBe("1.5 KiB");
    expect(formatFileSize(5 * 1024 * 1024, { units: "binary" })).toBe("5 MiB");
  });

  test("drops a trailing .0 after rounding", () => {
    expect(formatFileSize(1020)).toBe("1 kB");
    expect(formatFileSize(1044, { units: "binary" })).toBe("1 KiB");
  });

  test("promotes to the next unit when rounding reaches the base", () => {
    expect(formatFileSize(999.99)).toBe("1 kB");
    expect(formatFileSize(999_999)).toBe("1 MB");
    expect(formatFileSize(1024 * 1024 - 1, { units: "binary" })).toBe("1 MiB");
  });

  test("formats the number with a locale", () => {
    expect(formatFileSize(1500, { locale: "de-DE" })).toBe("1,5 kB");
    expect(formatFileSize(1023, { units: "binary", locale: "en-US" })).toBe(
      "1023 B",
    );
  });

  test("returns an empty string for invalid input", () => {
    expect(formatFileSize(Number.NaN)).toBe("");
    expect(formatFileSize(-1)).toBe("");
  });
});
