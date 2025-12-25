import {
  compareValues,
  formatHeaderWidth,
  getDisplayedRows,
  resolvePath,
  rowsEqual,
} from "../../src/DataTable/data-table-utils.js";

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

  it("returns true when rows have same IDs and same data", () => {
    const rowsA = [
      { id: 1, name: "Row 1", value: 100 },
      { id: 2, name: "Row 2", value: 200 },
    ];
    const rowsB = [
      { id: 1, name: "Row 1", value: 100 },
      { id: 2, name: "Row 2", value: 200 },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("handles rows with nested objects", () => {
    const rowsA = [
      {
        id: 1,
        name: "Row 1",
        contact: { company: "Company A", email: "test@example.com" },
      },
    ];
    const rowsB = [
      {
        id: 1,
        name: "Row 1",
        contact: { company: "Company A", email: "test@example.com" },
      },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects changes in nested objects", () => {
    const rowsA = [
      {
        id: 1,
        name: "Row 1",
        contact: { company: "Company A", email: "test@example.com" },
      },
    ];
    const rowsB = [
      {
        id: 1,
        name: "Row 1",
        contact: { company: "Company B", email: "test@example.com" },
      },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with arrays", () => {
    const rowsA = [
      { id: 1, name: "Row 1", tags: ["tag1", "tag2"] },
      { id: 2, name: "Row 2", tags: ["tag3"] },
    ];
    const rowsB = [
      { id: 1, name: "Row 1", tags: ["tag1", "tag2"] },
      { id: 2, name: "Row 2", tags: ["tag3"] },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects changes in array properties", () => {
    const rowsA = [{ id: 1, name: "Row 1", tags: ["tag1", "tag2"] }];
    const rowsB = [{ id: 1, name: "Row 1", tags: ["tag1", "tag3"] }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles null values in rows", () => {
    const rowsA = [{ id: 1, name: "Row 1", value: null }];
    const rowsB = [{ id: 1, name: "Row 1", value: null }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("handles undefined values in rows", () => {
    const rowsA = [{ id: 1, name: "Row 1", value: undefined }];
    const rowsB = [{ id: 1, name: "Row 1", value: undefined }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("distinguishes between null and undefined", () => {
    type Row = {
      id: number;
      name: string;
      value: null | undefined;
    };
    const rowsA: readonly Row[] = [{ id: 1, name: "Row 1", value: null }];
    const rowsB: readonly Row[] = [{ id: 1, name: "Row 1", value: undefined }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with missing id property", () => {
    const rowsA = [{ name: "Row 1" }];
    const rowsB = [{ name: "Row 1" }];
    // Both have undefined id, so ID comparison passes, then deep comparison
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("handles rows with NaN values", () => {
    const rowsA = [{ id: 1, name: "Row 1", count: Number.NaN }];
    const rowsB = [{ id: 1, name: "Row 1", count: Number.NaN }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("handles rows with Date objects", () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-01-01");
    const rowsA = [{ id: 1, name: "Row 1", date: date1 }];
    const rowsB = [{ id: 1, name: "Row 1", date: date2 }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects different Date values", () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-01-02");
    const rowsA = [{ id: 1, name: "Row 1", date: date1 }];
    const rowsB = [{ id: 1, name: "Row 1", date: date2 }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with RegExp objects", () => {
    const rowsA = [{ id: 1, name: "Row 1", pattern: /abc/ }];
    const rowsB = [{ id: 1, name: "Row 1", pattern: /abc/ }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects different RegExp values", () => {
    const rowsA = [{ id: 1, name: "Row 1", pattern: /abc/ }];
    const rowsB = [{ id: 1, name: "Row 1", pattern: /xyz/ }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with function properties", () => {
    const handler = () => console.log("test");
    const rowsA = [{ id: 1, name: "Row 1", handler }];
    const rowsB = [{ id: 1, name: "Row 1", handler }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects different function references", () => {
    const handler1 = () => console.log("test1");
    const handler2 = () => console.log("test2");
    const rowsA = [{ id: 1, name: "Row 1", handler: handler1 }];
    const rowsB = [{ id: 1, name: "Row 1", handler: handler2 }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with Symbol properties", () => {
    const sym = Symbol("test");
    const rowsA = [{ id: 1, name: "Row 1", [sym]: "value1" }];
    const rowsB = [{ id: 1, name: "Row 1", [sym]: "value1" }];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects different Symbol property values", () => {
    const sym = Symbol("test");
    const rowsA = [{ id: 1, name: "Row 1", [sym]: "value1" }];
    const rowsB = [{ id: 1, name: "Row 1", [sym]: "value2" }];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(rowsEqual([], [])).toBe(true);
  });

  it("handles rows with deeply nested structures", () => {
    const rowsA = [
      {
        id: 1,
        name: "Row 1",
        data: {
          nested: {
            deep: {
              value: "test",
              numbers: [1, 2, 3],
            },
          },
        },
      },
    ];
    const rowsB = [
      {
        id: 1,
        name: "Row 1",
        data: {
          nested: {
            deep: {
              value: "test",
              numbers: [1, 2, 3],
            },
          },
        },
      },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
  });

  it("detects changes in deeply nested structures", () => {
    const rowsA = [
      {
        id: 1,
        name: "Row 1",
        data: {
          nested: {
            deep: {
              value: "test",
              numbers: [1, 2, 3],
            },
          },
        },
      },
    ];
    const rowsB = [
      {
        id: 1,
        name: "Row 1",
        data: {
          nested: {
            deep: {
              value: "changed",
              numbers: [1, 2, 3],
            },
          },
        },
      },
    ];
    expect(rowsEqual(rowsA, rowsB)).toBe(false);
  });

  it("handles rows with circular references", () => {
    type RowWithSelf = {
      id: number;
      name: string;
      self?: RowWithSelf;
    };
    const rowA: RowWithSelf = { id: 1, name: "Row 1" };
    rowA.self = rowA;
    const rowB: RowWithSelf = { id: 1, name: "Row 1" };
    rowB.self = rowB;
    const rowsA = [rowA];
    const rowsB = [rowB];
    expect(rowsEqual(rowsA, rowsB)).toBe(true);
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

  describe("Generics", () => {
    it("should preserve row type with custom row interface", () => {
      type CustomRow = {
        id: string;
        name: string;
        age: number;
        email: string;
        status: "active" | "inactive";
      };

      const rowsA: readonly CustomRow[] = [
        {
          id: "1",
          name: "John",
          age: 30,
          email: "john@example.com",
          status: "active",
        },
      ];
      const rowsB: readonly CustomRow[] = [
        {
          id: "1",
          name: "John",
          age: 30,
          email: "john@example.com",
          status: "active",
        },
      ];

      const result = rowsEqual(rowsA, rowsB);
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();
      expectTypeOf<typeof rowsA>().toHaveProperty("length");
      expectTypeOf<(typeof rowsA)[number]>().toEqualTypeOf<CustomRow>();
    });

    it("should work with rows that have nested objects", () => {
      type NestedRow = {
        id: number;
        name: string;
        contact: {
          company: string;
          email: string;
        };
        metadata: {
          tags: string[];
          count: number;
        };
      };

      const rowsA: readonly NestedRow[] = [
        {
          id: 1,
          name: "Row 1",
          contact: { company: "Company A", email: "test@example.com" },
          metadata: { tags: ["tag1"], count: 10 },
        },
      ];
      const rowsB: readonly NestedRow[] = [
        {
          id: 1,
          name: "Row 1",
          contact: { company: "Company A", email: "test@example.com" },
          metadata: { tags: ["tag1"], count: 10 },
        },
      ];

      const result = rowsEqual(rowsA, rowsB);
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();
      expectTypeOf<(typeof rowsA)[number]["contact"]>().toHaveProperty(
        "company",
      );
      expectTypeOf<(typeof rowsA)[number]["metadata"]>().toHaveProperty("tags");
    });

    it("should work with rows that have optional id property", () => {
      type RowWithOptionalId = {
        id?: string;
        name: string;
        value: number;
      };

      const rowsA: readonly RowWithOptionalId[] = [
        { id: "1", name: "Row 1", value: 100 },
        { name: "Row 2", value: 200 },
      ];
      const rowsB: readonly RowWithOptionalId[] = [
        { id: "1", name: "Row 1", value: 100 },
        { name: "Row 2", value: 200 },
      ];

      const result = rowsEqual(rowsA, rowsB);
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();

      // Verify optional id is handled
      expectTypeOf<(typeof rowsA)[number]["id"]>().toEqualTypeOf<
        string | undefined
      >();
    });

    it("should work with rows that extend Record<string, any>", () => {
      // biome-ignore lint/suspicious/noExplicitAny: test case
      type ExtendedRow = Record<string, any> & {
        id: number;
        name: string;
      };

      const rowsA: readonly ExtendedRow[] = [
        { id: 1, name: "Row 1", extra: "value" },
      ];
      const rowsB: readonly ExtendedRow[] = [
        { id: 1, name: "Row 1", extra: "value" },
      ];

      const result = rowsEqual(rowsA, rowsB);
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();

      // Verify extended properties are accessible
      expectTypeOf<(typeof rowsA)[number]>().toHaveProperty("id");
      expectTypeOf<(typeof rowsA)[number]>().toHaveProperty("name");
    });

    it("should accept null as valid input type", () => {
      type CustomRow = {
        id: number;
        name: string;
      };

      const rows: readonly CustomRow[] = [{ id: 1, name: "Row 1" }];

      // Verify null is accepted for both parameters
      const result1 = rowsEqual(null, rows);
      const result2 = rowsEqual(rows, null);
      const result3 = rowsEqual(null, null);

      expectTypeOf<typeof result1>().toEqualTypeOf<boolean>();
      expectTypeOf<typeof result2>().toEqualTypeOf<boolean>();
      expectTypeOf<typeof result3>().toEqualTypeOf<boolean>();
    });

    it("should work with readonly arrays", () => {
      const rowsA = [
        { id: "1", value: 100 },
        { id: "2", value: 200 },
      ] as const;

      const rowsB = [
        { id: "1", value: 100 },
        { id: "2", value: 200 },
      ] as const;

      const result = rowsEqual(rowsA, rowsB);
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();
      expectTypeOf<typeof rowsA>().toHaveProperty("length");
    });

    it("should preserve type when comparing different row types", () => {
      type RowA = {
        id: number;
        name: string;
      };

      type RowB = {
        id: number;
        title: string;
      };

      const rowsA: readonly RowA[] = [{ id: 1, name: "Row 1" }];
      const rowsB: readonly RowB[] = [{ id: 1, title: "Row 1" }];

      const result = rowsEqual(
        rowsA,
        // Runtime allows comparing different row types (both extend Record<string, any>)
        // Type assertion needed because TypeScript requires both parameters to be the same generic type
        rowsB as unknown as readonly RowA[],
      );
      expectTypeOf<typeof result>().toEqualTypeOf<boolean>();
    });
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
      "key with spaces": "value2",
    };
    // Direct property access works
    expect(resolvePath(obj, "key.with.dots")).toBe("value1");
  });

  it("handles deeply nested paths", () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deep value",
            },
          },
        },
      },
    };
    expect(resolvePath(obj, "level1.level2.level3.level4.value")).toBe(
      "deep value",
    );
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

  it("handles numeric values in nested paths", () => {
    const obj = {
      data: {
        count: 42,
        price: 99.99,
      },
    };
    expect(resolvePath(obj, "data.count")).toBe(42);
    expect(resolvePath(obj, "data.price")).toBe(99.99);
  });

  it("handles boolean values in nested paths", () => {
    const obj = {
      settings: {
        enabled: true,
        active: false,
      },
    };
    expect(resolvePath(obj, "settings.enabled")).toBe(true);
    expect(resolvePath(obj, "settings.active")).toBe(false);
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
      // "10" should come after "2" with numeric sorting
      expect(compareValues("2", "10", true)).toBeLessThan(0);
      expect(compareValues("10", "2", true)).toBeGreaterThan(0);
    });

    it("handles case-sensitive string comparison", () => {
      expect(compareValues("Apple", "apple", true)).not.toBe(0);
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

  describe("custom sort function", () => {
    it("uses custom sort function when provided", () => {
      const customSort = (a: number, b: number) => {
        // Reverse numeric order
        return b - a;
      };
      expect(compareValues(1, 2, true, customSort)).toBe(1);
      expect(compareValues(2, 1, true, customSort)).toBe(-1);
    });

    it("ignores ascending parameter when custom sort is provided", () => {
      const customSort = (a: string, b: string) => a.length - b.length; // Sort by string length
      expect(compareValues("a", "abc", true, customSort)).toBeLessThan(0);
      expect(compareValues("a", "abc", false, customSort)).toBeLessThan(0);
    });

    it("handles custom sort returning zero", () => {
      const customSort = () => 0;
      expect(compareValues("a", "b", true, customSort)).toBe(0);
    });
  });

  describe("mixed type comparison", () => {
    it("converts numbers to strings for comparison with strings", () => {
      const result = compareValues(
        123,
        // @ts-expect-error test case
        "456",
        true,
      );
      expect(typeof result).toBe("number");
    });

    it("handles boolean values", () => {
      expect(compareValues(true, false, true)).not.toBe(0);
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
      expect(compareValues("a", "a!", true)).not.toBe(0);
    });

    it("handles very large numbers", () => {
      expect(compareValues(Number.MAX_SAFE_INTEGER, 1, true)).toBeGreaterThan(
        0,
      );
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
    const result = getDisplayedRows(rows, 3, 5);
    expect(result).toHaveLength(0); // Page 3 with pageSize 5 would be beyond the array
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
