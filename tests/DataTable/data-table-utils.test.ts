import { rowsEqual } from "../../src/DataTable/data-table-utils.js";

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
