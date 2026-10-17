import type { ToCsvHeader } from "../../src/DataTable/data-table-utils.js";
import {
  compareValues,
  formatHeaderWidth,
  getDisplayedRows,
  resolvePath,
  rowsEqual,
  shouldIgnoreRowClick,
  toCsv,
} from "../../src/DataTable/data-table-utils.js";

describe("shouldIgnoreRowClick", () => {
  it("returns true for element with bx--checkbox class", () => {
    const el = document.createElement("div");
    el.className = "bx--checkbox";
    expect(shouldIgnoreRowClick(el)).toBe(true);
  });

  it("returns true for element with bx--radio-button class", () => {
    const el = document.createElement("div");
    el.className = "bx--radio-button-wrapper";
    expect(shouldIgnoreRowClick(el)).toBe(true);
  });

  it("returns true for element with bx--overflow-menu class", () => {
    const el = document.createElement("div");
    el.className = "bx--overflow-menu";
    expect(shouldIgnoreRowClick(el)).toBe(true);
  });

  it("returns true when element has matching class among multiple classes", () => {
    const el = document.createElement("div");
    el.className = "bx--data-table-cell bx--checkbox bx--form-item";
    expect(shouldIgnoreRowClick(el)).toBe(true);
  });

  it("returns false for element without matching classes", () => {
    const el = document.createElement("div");
    el.className = "bx--data-table-cell bx--table-cell";
    expect(shouldIgnoreRowClick(el)).toBe(false);
  });

  it("returns false for null target", () => {
    expect(shouldIgnoreRowClick(null)).toBe(false);
  });

  it("returns false for target without classList (e.g. document)", () => {
    expect(shouldIgnoreRowClick(document)).toBe(false);
  });

  it("returns false for element with empty class list", () => {
    const el = document.createElement("div");
    expect(shouldIgnoreRowClick(el)).toBe(false);
  });
});

describe("rowsEqual", () => {
  it("returns true for same reference", () => {
    const rows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    expect(rowsEqual(rows, rows)).toBe(true);
  });

  it("returns true for identical arrays with same structure", () => {
    const rowsA = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    const rowsB = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("returns false when first argument is null", () => {
    const rows = [{ id: 1, name: "Row 1" }];
    expect(rowsEqual(null, rows)).toBe(false);
  });

  it("returns false when second argument is null", () => {
    const rows = [{ id: 1, name: "Row 1" }];
    expect(rowsEqual(rows, null)).toBe(false);
  });

  it("returns true when both arguments are null (via same reference check)", () => {
    const nullValue = null;
    expect(rowsEqual(nullValue, nullValue)).toBe(true);
  });

  it("returns false when first argument is not an array", () => {
    const rows = [{ id: 1, name: "Row 1" }];
    // @ts-expect-error
    expect(rowsEqual({}, rows)).toBe(false);
    // @ts-expect-error
    expect(rowsEqual("string", rows)).toBe(false);
    // @ts-expect-error
    expect(rowsEqual(123, rows)).toBe(false);
  });

  it("returns false when second argument is not an array", () => {
    const rows = [{ id: 1, name: "Row 1" }];
    // @ts-expect-error
    expect(rowsEqual(rows, {})).toBe(false);
    // @ts-expect-error
    expect(rowsEqual(rows, "string")).toBe(false);
    // @ts-expect-error
    expect(rowsEqual(rows, 123)).toBe(false);
  });

  it("returns false when arrays have different lengths", () => {
    const rowsA = [{ id: 1, name: "Row 1" }];
    const rowsB = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("returns false when row IDs differ", () => {
    const rowsA = [{ id: 1, name: "Row 1" }];
    const rowsB = [{ id: 2, name: "Row 1" }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("returns false when row IDs are in different order", () => {
    const rowsA = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    const rowsB = [
      { id: 2, name: "Row 2" },
      { id: 1, name: "Row 1" },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("returns false when rows have same IDs but different data", () => {
    const rowsA = [{ id: 1, name: "Row 1" }];
    const rowsB = [{ id: 1, name: "Row 1 Updated" }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with missing id property", () => {
    const rowsA = [{ name: "Row 1" }];
    const rowsB = [{ name: "Row 1" }];
    // Both have undefined id, so ID comparison passes, then deep comparison
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("handles empty arrays", () => {
    expect(rowsEqual([], [])).toBe(true);
  });

  it("handles multiple rows with mixed properties", () => {
    const rowsA = [
      { id: 1, name: "Row 1", active: true, count: 10 },
      { id: 2, name: "Row 2", active: false, count: 20 },
      { id: 3, name: "Row 3", active: true, count: 30 },
    ];
    const rowsB = [
      { id: 1, name: "Row 1", active: true, count: 10 },
      { id: 2, name: "Row 2", active: false, count: 20 },
      { id: 3, name: "Row 3", active: true, count: 30 },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects changes in one row of multiple rows", () => {
    const rowsA = [
      { id: 1, name: "Row 1", active: true },
      { id: 2, name: "Row 2", active: false },
      { id: 3, name: "Row 3", active: true },
    ];
    const rowsB = [
      { id: 1, name: "Row 1", active: true },
      { id: 2, name: "Row 2 Changed", active: false },
      { id: 3, name: "Row 3", active: true },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows where objects are same reference", () => {
    const sharedObj = { company: "Company A" };
    const rowsA = [{ id: 1, name: "Row 1", contact: sharedObj }];
    const rowsB = [{ id: 1, name: "Row 1", contact: sharedObj }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("accepts null and readonly arrays", () => {
    const rows = [
      { id: "1", value: 100 },
      { id: "2", value: 200 },
    ] as const;

    expectTypeOf(rowsEqual(null, rows)).toEqualTypeOf<boolean>();
    expectTypeOf(rowsEqual(rows, null)).toEqualTypeOf<boolean>();
    expectTypeOf(rowsEqual(rows, rows)).toEqualTypeOf<boolean>();
  });
});

describe("resolvePath", () => {
  it("resolves direct property access", () => {
    const obj = { name: "John", age: 30 };
    expect(resolvePath(obj, "name")).toBe("John");
    expect(resolvePath(obj, "age")).toBe(30);
  });

  it("resolves nested property paths", () => {
    const obj = {
      contact: {
        company: "Acme Corp",
        address: {
          city: "New York",
        },
      },
    };
    expect(resolvePath(obj, "contact.company")).toBe("Acme Corp");
    expect(resolvePath(obj, "contact.address.city")).toBe("New York");
  });

  it("returns undefined for non-existent paths", () => {
    const obj = { name: "John" };
    expect(resolvePath(obj, "missing")).toBeUndefined();
    expect(resolvePath(obj, "contact.company")).toBeUndefined();
  });

  it("handles null and undefined in path resolution", () => {
    const obj = {
      contact: null,
      address: undefined,
      nested: {
        value: "test",
      },
    };
    expect(resolvePath(obj, "contact")).toBe(null);
    expect(resolvePath(obj, "address")).toBeUndefined();
    expect(resolvePath(obj, "nested.value")).toBe("test");
  });

  it("handles array indices in paths", () => {
    const obj = {
      items: ["first", "second", "third"],
      nested: {
        arr: [1, 2, 3],
      },
    };
    // Note: array indices work if the path uses bracket notation in the string
    // But our regex splits on brackets, so "items[0]" becomes ["items", "0"]
    expect(resolvePath(obj, "items.0")).toBe("first");
    expect(resolvePath(obj, "nested.arr.1")).toBe(2);
  });

  it("handles paths with special characters", () => {
    const obj = {
      "key.with.dots": "value1",
    };
    // Direct property access works
    expect(resolvePath(obj, "key.with.dots")).toBe("value1");
  });

  it("handles paths that stop at non-object values", () => {
    const obj = {
      name: "John",
      contact: {
        email: "john@example.com",
      },
    };
    // When accessing "name.email", "name" is a string (not an object),
    // so the reduce returns the string value itself, not undefined
    expect(resolvePath(obj, "name.email")).toBe("John");
    // But accessing a non-existent nested path returns undefined
    expect(resolvePath(obj, "contact.missing")).toBeUndefined();
  });

  it("handles empty string paths", () => {
    const obj = { name: "John" };
    // Empty string should try to access the object itself
    expect(resolvePath(obj, "")).toBe(obj);
  });
});

describe("compareValues", () => {
  describe("numeric comparison", () => {
    it("compares numbers in ascending order", () => {
      expect(compareValues(1, 2, true)).toBeLessThan(0);
      expect(compareValues(2, 1, true)).toBeGreaterThan(0);
      expect(compareValues(1, 1, true)).toBe(0);
    });

    it("compares numbers in descending order", () => {
      expect(compareValues(1, 2, false)).toBeGreaterThan(0);
      expect(compareValues(2, 1, false)).toBeLessThan(0);
      // Handle -0 case (when result is 0, -0 === 0 is true but Object.is(-0, 0) is false)
      const result = compareValues(1, 1, false);
      expect(result === 0).toBe(true);
    });

    it("handles negative numbers", () => {
      expect(compareValues(-5, -3, true)).toBeLessThan(0);
      expect(compareValues(-3, -5, true)).toBeGreaterThan(0);
    });

    it("handles zero", () => {
      expect(compareValues(0, 5, true)).toBeLessThan(0);
      expect(compareValues(5, 0, true)).toBeGreaterThan(0);
      expect(compareValues(0, 0, true)).toBe(0);
    });

    it("handles decimal numbers", () => {
      expect(compareValues(1.5, 2.3, true)).toBeLessThan(0);
      expect(compareValues(2.3, 1.5, true)).toBeGreaterThan(0);
    });
  });

  describe("string comparison", () => {
    it("compares strings in ascending order", () => {
      expect(compareValues("apple", "banana", true)).toBeLessThan(0);
      expect(compareValues("banana", "apple", true)).toBeGreaterThan(0);
      expect(compareValues("apple", "apple", true)).toBe(0);
    });

    it("compares strings in descending order", () => {
      expect(compareValues("apple", "banana", false)).toBeGreaterThan(0);
      expect(compareValues("banana", "apple", false)).toBeLessThan(0);
    });

    it("handles numeric strings with locale-aware sorting", () => {
      expect(compareValues("2", "10", true)).toBeLessThan(0);
      expect(compareValues("10", "2", true)).toBeGreaterThan(0);
    });

    it("handles case-insensitive string comparison", () => {
      expect(compareValues("Apple", "apple", true)).toBe(0);
    });
  });

  describe("null and undefined handling", () => {
    it("treats both null values as equal", () => {
      expect(compareValues(null, null, true)).toBe(0);
      // Handle -0 case
      const result = compareValues(null, null, false);
      expect(result === 0).toBe(true);
    });

    it("treats both undefined values as equal", () => {
      expect(compareValues(undefined, undefined, true)).toBe(0);
      // Handle -0 case
      const result = compareValues(undefined, undefined, false);
      expect(result === 0).toBe(true);
    });

    it("places null after defined values in ascending order", () => {
      expect(compareValues("value", null, true)).toBeLessThan(0);
      expect(compareValues(null, "value", true)).toBeGreaterThan(0);
    });

    it("places null before defined values in descending order", () => {
      expect(compareValues("value", null, false)).toBeGreaterThan(0);
      expect(compareValues(null, "value", false)).toBeLessThan(0);
    });

    it("places undefined after defined values in ascending order", () => {
      expect(compareValues("value", undefined, true)).toBeLessThan(0);
      expect(compareValues(undefined, "value", true)).toBeGreaterThan(0);
    });

    it("handles zero correctly (not treated as falsy)", () => {
      expect(compareValues(0, null, true)).toBeLessThan(0);
      expect(compareValues(null, 0, true)).toBeGreaterThan(0);
      expect(compareValues(0, undefined, true)).toBeLessThan(0);
    });
  });

  describe("sorting", () => {
    it("sorts ascending into alphabetical order", () => {
      const sorted = ["Cherry", "apple", "berry"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["apple", "berry", "Cherry"]);
    });

    it("sorts descending (case-insensitive)", () => {
      const sorted = ["apple", "berry", "Cherry"].sort((a, b) =>
        compareValues(a, b, false),
      );
      expect(sorted).toEqual(["Cherry", "berry", "apple"]);
    });

    it("sorts mixed case ascending (case-insensitive)", () => {
      const sorted = ["Banana", "apricot", "Apple", "cherry"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["Apple", "apricot", "Banana", "cherry"]);
    });

    it("sorts numeric strings ascending (numeric: true)", () => {
      const sorted = ["10", "2", "1", "20"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["1", "2", "10", "20"]);
    });

    it("sorts numeric strings descending", () => {
      const sorted = ["1", "2", "10", "20"].sort((a, b) =>
        compareValues(a, b, false),
      );
      expect(sorted).toEqual(["20", "10", "2", "1"]);
    });

    it("sorts with accents (sensitivity: base)", () => {
      const sorted = ["café", "cafe", "berry"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["berry", "café", "cafe"]);
    });

    it("sorts mixed accents and plain (alphabetical by base)", () => {
      const sorted = ["apple", "café", "apricot", "berry"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["apple", "apricot", "berry", "café"]);
    });

    it("sorts accent pairs (résumé=resume, naïve=naive)", () => {
      const sorted = ["résumé", "naïve", "resume", "naive"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["naïve", "naive", "résumé", "resume"]);
    });

    it("sorts mixed case and accents (case and accent insensitive)", () => {
      const sorted = ["Café", "cafe", "berry"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["berry", "Café", "cafe"]);
    });

    it("sorts umlauts with base letters (ä=a, ö=o, ü=u)", () => {
      const sorted = ["äpfel", "zoo", "apple"].sort((a, b) =>
        compareValues(a, b, true),
      );
      expect(sorted).toEqual(["äpfel", "apple", "zoo"]);
    });

    it("sorts umlauts descending", () => {
      const sorted = ["über", "äpfel", "zoo"].sort((a, b) =>
        compareValues(a, b, false),
      );
      expect(sorted).toEqual(["zoo", "über", "äpfel"]);
    });
  });

  describe("custom sort function", () => {
    it("uses custom sort function when provided", () => {
      const customSort = (a: number, b: number) => {
        return b - a;
      };
      expect(compareValues(1, 2, true, customSort)).toBe(1);
      expect(compareValues(2, 1, true, customSort)).toBe(-1);
    });

    it("applies ascending/descending to custom sort like the default comparator", () => {
      const customSort = (a: string, b: string) => a.length - b.length;
      expect(compareValues("a", "abc", true, customSort)).toBeLessThan(0);
      expect(compareValues("a", "abc", false, customSort)).toBeGreaterThan(0);
    });

    it("handles custom sort returning zero", () => {
      const customSort = () => 0;
      expect(compareValues("a", "b", true, customSort)).toBe(0);
      // -0 from negation; still a zero comparator result (see numeric descending tests)
      expect(compareValues("a", "b", false, customSort) === 0).toBe(true);
    });
  });

  describe("mixed type comparison", () => {
    it("converts numbers to strings for comparison with strings", () => {
      // Compared as strings with the numeric collator: 10 > 9, whereas a
      // plain string comparison would order "10" before "9".
      expect(
        compareValues(
          10,
          // @ts-expect-error test case
          "9",
          true,
        ),
      ).toBeGreaterThan(0);
      expect(
        compareValues(
          "9",
          // @ts-expect-error test case
          10,
          true,
        ),
      ).toBeLessThan(0);
    });

    it("handles boolean values", () => {
      // `false` is falsy, so it sorts like a missing value: after `true`
      expect(compareValues(true, false, true)).toBeLessThan(0);
      expect(compareValues(false, true, true)).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty strings", () => {
      // Empty string comparison: "" < "a" in localeCompare returns negative
      // But our function handles empty strings as falsy, so they're treated specially
      // Empty string is falsy, so it goes through the null/undefined handling path
      const result1 = compareValues("", "a", true);
      // Empty string is falsy, so !itemA is true, result should be 1 (empty comes after)
      expect(result1).toBeGreaterThan(0);
      const result2 = compareValues("a", "", true);
      expect(result2).toBeLessThan(0);
      // Both empty strings are falsy, so result is 0
      const result3 = compareValues("", "", true);
      expect(result3 === 0).toBe(true);
    });

    it("handles special characters in strings", () => {
      expect(compareValues("a", "a!", true)).toBeLessThan(0);
    });

    it("handles very large numbers", () => {
      expect(compareValues(Number.MAX_SAFE_INTEGER, 1, true)).toBeGreaterThan(
        0,
      );
    });
  });

  describe("localeCompare behavior", () => {
    it("is case-insensitive with sensitivity: base", () => {
      // With sensitivity: "base", case differences are ignored
      expect(compareValues("apple", "Apple", true)).toBe(0);
      expect(compareValues("Apple", "apple", true)).toBe(0);
      expect(compareValues("BANANA", "banana", true)).toBe(0);
    });

    it("is accent-insensitive with sensitivity: base", () => {
      // With sensitivity: "base", accent differences are ignored
      expect(compareValues("cafe", "café", true)).toBe(0);
      expect(compareValues("résumé", "resume", true)).toBe(0);
      expect(compareValues("naïve", "naive", true)).toBe(0);
    });

    it("sorts alphabetically ignoring case", () => {
      // With sensitivity: "base", "Apple" and "apple" are equal,
      // so their relative order depends on sort stability
      const sorted = ["banana", "Apple", "cherry", "Banana", "apple"].sort(
        (a, b) => compareValues(a, b, true, undefined),
      );
      // All "apple" variants group together, all "banana" variants group together (stable sort)
      expect(sorted).toEqual(["Apple", "apple", "banana", "Banana", "cherry"]);
    });

    it("handles unicode characters", () => {
      // With sensitivity: "base", umlauts are treated as their base letters
      expect(compareValues("ä", "a", true)).toBe(0);
      expect(compareValues("ö", "o", true)).toBe(0);
      expect(compareValues("ü", "u", true)).toBe(0);
      // But different base letters are still distinct
      expect(compareValues("ä", "z", true)).toBeLessThan(0);
    });
  });
});

describe("getDisplayedRows", () => {
  const rows = [
    { id: 1, name: "Row 1" },
    { id: 2, name: "Row 2" },
    { id: 3, name: "Row 3" },
    { id: 4, name: "Row 4" },
    { id: 5, name: "Row 5" },
    { id: 6, name: "Row 6" },
    { id: 7, name: "Row 7" },
    { id: 8, name: "Row 8" },
    { id: 9, name: "Row 9" },
    { id: 10, name: "Row 10" },
  ];

  it("returns all rows when pagination is disabled", () => {
    expect(getDisplayedRows(rows, 0, 0)).toEqual(rows);
    expect(getDisplayedRows(rows, 0, 5)).toEqual(rows);
    expect(getDisplayedRows(rows, 1, 0)).toEqual(rows);
  });

  it("returns first page correctly", () => {
    const result = getDisplayedRows(rows, 1, 5);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(1);
    expect(result[4].id).toBe(5);
  });

  it("returns second page correctly", () => {
    const result = getDisplayedRows(rows, 2, 5);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(6);
    expect(result[4].id).toBe(10);
  });

  it("returns partial last page correctly", () => {
    // 10 rows at 3 per page: page 4 holds only the 10th row
    expect(getDisplayedRows(rows, 4, 3)).toEqual([rows[9]]);
  });

  it("handles page size larger than total rows", () => {
    const result = getDisplayedRows(rows, 1, 100);
    expect(result).toHaveLength(10);
    expect(result).toEqual(rows);
  });

  it("handles empty array", () => {
    expect(getDisplayedRows([], 1, 5)).toEqual([]);
  });

  it("handles single row", () => {
    const singleRow = [{ id: 1, name: "Row 1" }];
    expect(getDisplayedRows(singleRow, 1, 5)).toEqual(singleRow);
  });

  it("handles page beyond available data", () => {
    const result = getDisplayedRows(rows, 10, 5);
    expect(result).toHaveLength(0);
  });

  it("handles pageSize of 1", () => {
    const result = getDisplayedRows(rows, 3, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("preserves row references", () => {
    const result = getDisplayedRows(rows, 1, 5);
    expect(result[0]).toBe(rows[0]);
    expect(result[4]).toBe(rows[4]);
  });
});

describe("formatHeaderWidth", () => {
  it("returns undefined when no width styles are provided", () => {
    expect(formatHeaderWidth({})).toBeUndefined();
    expect(formatHeaderWidth({ key: "name", value: "Name" })).toBeUndefined();
  });

  it("formats width only", () => {
    const header = { width: "200px" };
    expect(formatHeaderWidth(header)).toBe("width: 200px");
  });

  it("formats minWidth only", () => {
    const header = { minWidth: "150px" };
    expect(formatHeaderWidth(header)).toBe("min-width: 150px");
  });

  it("formats both width and minWidth", () => {
    const header = { width: "200px", minWidth: "150px" };
    expect(formatHeaderWidth(header)).toBe("width: 200px;min-width: 150px");
  });

  it("handles different width units", () => {
    expect(formatHeaderWidth({ width: "50%" })).toBe("width: 50%");
    expect(formatHeaderWidth({ width: "10rem" })).toBe("width: 10rem");
    expect(formatHeaderWidth({ width: "auto" })).toBe("width: auto");
  });

  it("handles falsy width values", () => {
    // Empty string is falsy, so it gets filtered out
    expect(formatHeaderWidth({ width: "" })).toBeUndefined();
    // 0 is falsy, so it also gets filtered out
    expect(formatHeaderWidth({ width: 0 })).toBeUndefined();
  });

  it("handles header with other properties", () => {
    const header = {
      key: "name",
      value: "Name",
      width: "200px",
      minWidth: "150px",
    };
    expect(formatHeaderWidth(header)).toBe("width: 200px;min-width: 150px");
  });

  it("handles undefined width properties", () => {
    const header = { width: undefined, minWidth: undefined };
    expect(formatHeaderWidth(header)).toBeUndefined();
  });

  it("handles null width properties", () => {
    const header = { width: null, minWidth: null };
    // null is falsy, so it won't be included
    expect(formatHeaderWidth(header)).toBeUndefined();
  });
});

describe("toCsv", () => {
  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ];
  const rows = [
    { id: "a", name: "Load Balancer 1", port: 3000 },
    { id: "b", name: "Load Balancer 2", port: 443 },
  ];

  it("serializes headers and rows with CRLF line endings", () => {
    expect(toCsv(headers, rows)).toBe(
      "Name,Port\r\nLoad Balancer 1,3000\r\nLoad Balancer 2,443",
    );
  });

  it("omits the header row when includeHeaders is false", () => {
    expect(toCsv(headers, rows, { includeHeaders: false })).toBe(
      "Load Balancer 1,3000\r\nLoad Balancer 2,443",
    );
  });

  it("quotes fields containing the delimiter, quotes, or newlines", () => {
    const csv = toCsv(
      [{ key: "name", value: "Name" }],
      [
        { id: "a", name: "Round robin, DNS delegation" },
        { id: "b", name: 'Rule "primary"' },
        { id: "c", name: "Line 1\nLine 2" },
      ],
    );

    expect(csv).toBe(
      [
        "Name",
        '"Round robin, DNS delegation"',
        '"Rule ""primary"""',
        '"Line 1\nLine 2"',
      ].join("\r\n"),
    );
  });

  it("applies display formatting instead of the raw value", () => {
    const csv = toCsv(
      [
        {
          key: "port",
          value: "Port",
          display: (item: unknown) => `Port ${item}`,
        },
      ],
      rows,
    );

    expect(csv).toBe("Port\r\nPort 3000\r\nPort 443");
  });

  it("resolves nested dot-notation keys", () => {
    const csv = toCsv(
      [{ key: "contact.company", value: "Company" }],
      [{ id: "a", contact: { company: "IBM" } }],
    );

    expect(csv).toBe("Company\r\nIBM");
  });

  it("skips empty headers", () => {
    const csv = toCsv(
      [
        { key: "name", value: "Name" },
        { key: "overflow", empty: true },
      ],
      rows,
    );

    expect(csv).toBe("Name\r\nLoad Balancer 1\r\nLoad Balancer 2");
  });

  it("skips hidden headers", () => {
    const csv = toCsv(
      [
        { key: "name", value: "Name" },
        { key: "port", value: "Port", columnHidden: true },
        { key: "rule", value: "Rule" },
      ],
      [
        { id: "a", name: "Load Balancer 1", port: 3000, rule: "Round robin" },
        { id: "b", name: "Load Balancer 2", port: 443, rule: "DNS delegation" },
      ],
    );

    expect(csv).toBe(
      "Name,Rule\r\nLoad Balancer 1,Round robin\r\nLoad Balancer 2,DNS delegation",
    );
  });

  it("keeps headers with columnHidden set to false", () => {
    const csv = toCsv(
      [
        { key: "name", value: "Name" },
        { key: "port", value: "Port", columnHidden: false },
      ],
      rows,
    );

    expect(csv).toBe(
      "Name,Port\r\nLoad Balancer 1,3000\r\nLoad Balancer 2,443",
    );
  });

  it("does not format values of hidden headers", () => {
    const display = vi.fn((item: unknown) => `Port ${item}`);
    const csv = toCsv(
      [
        { key: "name", value: "Name" },
        { key: "port", value: "Port", columnHidden: true, display },
      ],
      rows,
    );

    expect(csv).toBe("Name\r\nLoad Balancer 1\r\nLoad Balancer 2");
    expect(display).not.toHaveBeenCalled();
  });

  it("accepts columnHidden on typed headers", () => {
    type Row = { id: string; name: string; port: number };
    const typedHeaders: ToCsvHeader<Row>[] = [
      { key: "name", value: "Name" },
      { key: "port", value: "Port", columnHidden: true },
    ];

    expect(toCsv<Row>(typedHeaders, [{ id: "a", name: "A", port: 1 }])).toBe(
      "Name\r\nA",
    );
  });

  it("falls back to the header key when value is absent", () => {
    expect(toCsv([{ key: "name" }], rows)).toBe(
      "name\r\nLoad Balancer 1\r\nLoad Balancer 2",
    );
  });

  it("stringifies null, undefined, and Date values", () => {
    const csv = toCsv(
      [
        { key: "name", value: "Name" },
        { key: "port", value: "Port" },
        { key: "created", value: "Created" },
      ],
      [
        {
          id: "a",
          name: null,
          port: undefined,
          created: new Date("2024-01-15T10:30:00.000Z"),
        },
      ],
    );

    expect(csv).toBe("Name,Port,Created\r\n,,2024-01-15T10:30:00.000Z");
  });

  it("prefixes formula values unless escapeFormulas is false", () => {
    const formulaHeaders = [{ key: "name", value: "Name" }];
    const formulaRows = [{ id: "a", name: "=1+1" }];

    expect(toCsv(formulaHeaders, formulaRows)).toBe("Name\r\n'=1+1");
    expect(toCsv(formulaHeaders, formulaRows, { escapeFormulas: false })).toBe(
      "Name\r\n=1+1",
    );
  });

  it.each(["+", "-", "@", "\t"])(
    "prefixes values starting with %j when escaping formulas",
    (prefix) => {
      expect(
        toCsv(
          [{ key: "name", value: "Name" }],
          [{ id: "a", name: `${prefix}1` }],
        ),
      ).toBe(`Name\r\n'${prefix}1`);
    },
  );

  it("serializes object and array values as JSON", () => {
    const csv = toCsv(
      [
        { key: "tags", value: "Tags" },
        { key: "owner", value: "Owner" },
      ],
      [{ id: "a", tags: ["x", "y"], owner: { name: "Ada" } }],
    );

    expect(csv).toBe('Tags,Owner\r\n"[""x"",""y""]","{""name"":""Ada""}"');
  });

  it("joins lines with a custom newline", () => {
    expect(toCsv(headers, rows, { newline: "\n" })).toBe(
      "Name,Port\nLoad Balancer 1,3000\nLoad Balancer 2,443",
    );
  });

  it("uses a custom delimiter for both separation and quoting", () => {
    const csv = toCsv(
      headers,
      [{ id: "a", name: "Round robin, DNS delegation; fallback", port: 3000 }],
      { delimiter: ";" },
    );

    expect(csv).toBe(
      'Name;Port\r\n"Round robin, DNS delegation; fallback";3000',
    );
  });

  it("emits only the header row when there are no rows", () => {
    expect(toCsv(headers, [])).toBe("Name,Port");
  });
});
