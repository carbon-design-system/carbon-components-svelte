import {
  ENV_KEY_PATTERN,
  formatDefaults,
  fromRecord,
  mergeEntries,
  moveRow,
  rowsFromEntries,
  rowsFromFormData,
  toRecord,
  validateRows,
} from "carbon-components-svelte/KeyValueEditor/rows.js";

const row = (key: string, value = "", rest = {}) => ({ key, value, ...rest });

describe("validateRows", () => {
  it("accepts blank rows and flags a value with no key", () => {
    const { rows, errors } = validateRows([
      row(""),
      row("", "x"),
      row("", "", { description: "d" }),
    ]);
    expect(rows[0]).toBeUndefined();
    expect(rows[1]?.key?.code).toBe("key-required");
    expect(rows[2]?.key?.code).toBe("key-required");
    expect(errors).toBe(2);
  });

  it.each([
    ["A", true],
    ["_a1", true],
    ["a-b", false],
    ["1A", false],
    ["A B", false],
    ["A=", false],
    ["é", false],
    ["", false],
  ])("the env key %j is %s", (key, ok) => {
    expect(ENV_KEY_PATTERN.test(key)).toBe(ok);
  });

  it("flags both rows of a duplicate key", () => {
    const { rows } = validateRows([row("A"), row("B"), row("A")], {
      keyPattern: null,
    });
    expect(rows.map((r) => r?.key?.code)).toEqual([
      "key-duplicate",
      undefined,
      "key-duplicate",
    ]);
  });

  it("compares header names without case, and env keys with it", () => {
    const rows = [row("Accept", "a"), row("ACCEPT", "b")];
    expect(validateRows(rows, formatDefaults("headers")).errors).toBe(2);
    expect(validateRows(rows, formatDefaults("env")).errors).toBe(0);
  });

  it("warns for a duplicate when asked, and ignores it when allowed", () => {
    const rows = [row("A"), row("A")];
    const warned = validateRows(rows, { duplicateKeys: "warn" });
    expect(warned.errors).toBe(0);
    expect(warned.warnings).toBe(2);
    expect(validateRows(rows, { duplicateKeys: "allow" }).rows).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("lets a key repeat across scopes, and an empty scope means all of them", () => {
    const options = { scoped: true, keyPattern: null };
    const split = [
      row("A", "", { scope: "prod" }),
      row("A", "", { scope: "dev" }),
    ];
    expect(validateRows(split, options).errors).toBe(0);
    const same = [
      row("A", "", { scope: "prod" }),
      row("A", "", { scope: "prod" }),
    ];
    expect(validateRows(same, options).errors).toBe(2);
    const all = [row("A", "", { scope: "" }), row("A", "", { scope: "dev" })];
    expect(validateRows(all, options).errors).toBe(2);
  });

  it("reports a pattern before a duplicate, and keeps the duplicate off an invalid key", () => {
    const { rows } = validateRows([row("a b"), row("a b")], {
      keyPattern: ENV_KEY_PATTERN,
    });
    expect(rows.map((r) => r?.key?.code)).toEqual([
      "key-pattern",
      "key-pattern",
    ]);
  });

  it("checks lengths, reserved keys and the value pattern", () => {
    const options = {
      maxKeyLength: 4,
      maxValueLength: 4,
      reservedKeys: ["PATH"],
      valuePattern: /\n/,
      keyPattern: null,
      caseInsensitiveKeys: true,
    };
    const { rows } = validateRows(
      [row("LONGKEY"), row("path"), row("a", "12345"), row("b", "x\ny")],
      options,
    );
    expect(rows[0]?.key).toMatchObject({ code: "key-too-long", limit: 4 });
    expect(rows[1]?.key?.code).toBe("key-reserved");
    expect(rows[2]?.value).toMatchObject({ code: "value-too-long", limit: 4 });
    expect(rows[3]?.value?.code).toBe("value-invalid");
  });

  it("takes a function for reserved keys", () => {
    const { rows } = validateRows([row("AWS_X"), row("OK")], {
      reservedKeys: (key) => key.startsWith("AWS_"),
    });
    expect(rows[0]?.key?.code).toBe("key-reserved");
    expect(rows[1]).toBeUndefined();
  });

  it("does not check the value of a stored secret", () => {
    const { rows } = validateRows([row("S", "", { stored: true })], {
      maxValueLength: 0,
      valuePattern: /^$/,
    });
    expect(rows[0]).toBeUndefined();
  });

  it("runs a custom check last, and does not replace a built-in message", () => {
    const validate = vi.fn((r: { key: string }) =>
      r.key === "bad"
        ? { key: "No bad keys.", value: "Nor values." }
        : undefined,
    );
    const { rows } = validateRows([row("bad", "x"), row("ok")], {
      validate,
      keyPattern: /^[a-z]+$/,
    });
    expect(rows[0]?.key).toMatchObject({
      code: "custom",
      message: "No bad keys.",
    });
    expect(rows[0]?.value?.message).toBe("Nor values.");
    expect(rows[1]).toBeUndefined();
    expect(validate).toHaveBeenCalledWith(
      expect.anything(),
      0,
      expect.any(Array),
    );
  });

  it("validates 500 rows with duplicates in under 20 ms", () => {
    const rows = Array.from({ length: 500 }, (_, i) =>
      row(`KEY_${i % 400}`, "v"),
    );
    const start = performance.now();
    const result = validateRows(rows, formatDefaults("env"));
    expect(performance.now() - start).toBeLessThan(20);
    expect(result.errors).toBe(200);
  });
});

describe("toRecord and fromRecord", () => {
  it("skips blank, stored and disabled rows, and lets the last duplicate win", () => {
    expect(
      toRecord([
        row("A", "1"),
        row("", "x"),
        row("S", "", { stored: true }),
        row("OFF", "1", { enabled: false }),
        row("A", "2"),
      ]),
    ).toEqual({ A: "2" });
  });

  it("keeps __proto__ as an own key without touching the prototype", () => {
    const record = toRecord([row("__proto__", "x")]);
    expect(Object.keys(record)).toEqual(["__proto__"]);
    expect(Object.getPrototypeOf(record)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it("round-trips a record", () => {
    expect(toRecord(fromRecord({ A: "1", B: 2 as unknown as string }))).toEqual(
      {
        A: "1",
        B: "2",
      },
    );
  });
});

describe("moveRow", () => {
  it("moves a row, clamps at the ends, and returns the same array for no move", () => {
    const list = ["a", "b", "c"];
    expect(moveRow(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveRow(list, 2, -5)).toEqual(["c", "a", "b"]);
    expect(moveRow(list, 1, 1)).toBe(list);
    expect(moveRow(list, 9, 0)).toBe(list);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("mergeEntries", () => {
  it("updates a key that exists, appends a new one, and counts both", () => {
    const merged = mergeEntries(
      [row("A", "1"), row("B", "2")],
      [
        { key: "B", value: "20" },
        { key: "C", value: "3" },
      ],
    );
    expect(merged.rows).toEqual([row("A", "1"), row("B", "20"), row("C", "3")]);
    expect(merged).toMatchObject({
      added: 1,
      updated: 1,
      skipped: 0,
      firstIndex: 1,
    });
  });

  it("fills a blank row instead of leaving it behind", () => {
    const merged = mergeEntries(
      [row("A", "1"), row("")],
      [
        { key: "B", value: "2" },
        { key: "C", value: "3" },
      ],
      { replace: 1 },
    );
    expect(merged.rows.map((r) => r.key)).toEqual(["A", "B", "C"]);
    expect(merged.firstIndex).toBe(1);
  });

  it("does not replace a row that has content", () => {
    const merged = mergeEntries([row("A", "1")], [{ key: "B", value: "2" }], {
      replace: 0,
    });
    expect(merged.rows.map((r) => r.key)).toEqual(["A", "B"]);
  });

  it("un-stores a secret that is updated, and keeps its other flags", () => {
    const merged = mergeEntries(
      [row("S", "", { stored: true, secret: true })],
      [{ key: "S", value: "new" }],
    );
    expect(merged.rows[0]).toEqual({ key: "S", value: "new", secret: true });
  });

  it("matches keys without case when asked", () => {
    const merged = mergeEntries(
      [row("Accept", "a")],
      [{ key: "ACCEPT", value: "b" }],
      {
        caseInsensitive: true,
      },
    );
    expect(merged.rows).toEqual([row("Accept", "b")]);
  });

  it("stops at the limit and counts what it skipped", () => {
    const merged = mergeEntries(
      [row("A")],
      [
        { key: "B", value: "" },
        { key: "C", value: "" },
        { key: "D", value: "" },
      ],
      { limit: 2 },
    );
    expect(merged.rows).toHaveLength(2);
    expect(merged).toMatchObject({ added: 1, skipped: 2 });
  });

  it("applies defaults to new rows only", () => {
    const merged = mergeEntries(
      [row("A", "1")],
      [
        { key: "A", value: "2" },
        { key: "B", value: "3" },
      ],
      {
        defaults: { secret: true },
      },
    );
    expect(merged.rows).toEqual([
      row("A", "2"),
      row("B", "3", { secret: true }),
    ]);
  });
});

describe("rowsFromEntries", () => {
  it("keeps a row's flags by key when its line is edited or moved", () => {
    const base = [
      row("A", "1", { secret: true, description: "a" }),
      row("B", "2", { scope: "prod" }),
    ];
    const rows = rowsFromEntries(
      [
        { key: "B", value: "22" },
        { key: "A", value: "11" },
        { key: "N", value: "n" },
      ],
      base,
    );
    expect(rows).toEqual([
      row("B", "22", { scope: "prod" }),
      row("A", "11", { secret: true, description: "a" }),
      row("N", "n"),
    ]);
  });

  it("pairs repeated keys in order, disables from a comment and enables again", () => {
    const base = [row("A", "1", { enabled: false }), row("A", "2")];
    const rows = rowsFromEntries(
      [
        { key: "A", value: "x" },
        { key: "A", value: "y", enabled: false },
      ],
      base,
    );
    expect(rows).toEqual([
      row("A", "x", { enabled: true }),
      row("A", "y", { enabled: false }),
    ]);
  });

  it("does not hand a stored secret's flags to a typed line", () => {
    const rows = rowsFromEntries(
      [{ key: "S", value: "typed" }],
      [row("S", "", { stored: true })],
    );
    expect(rows).toEqual([row("S", "typed")]);
  });
});

describe("rowsFromFormData", () => {
  it("reads the editor's field names back, in index order", () => {
    const data = new FormData();
    data.append("env[1][key]", "B");
    data.append("env[1][value]", "2");
    data.append("env[0][key]", "A");
    data.append("env[0][value]", "1");
    data.append("env[0][secret]", "1");
    data.append("env[1][enabled]", "0");
    data.append("env[2][key]", "S");
    data.append("env[2][stored]", "1");
    data.append("other[0][key]", "nope");
    data.append("env[x][key]", "nope");
    expect(rowsFromFormData(data, "env")).toEqual([
      { key: "A", value: "1", secret: true },
      { key: "B", value: "2", enabled: false },
      { key: "S", value: "", stored: true },
    ]);
  });

  it("ignores a name that only starts the same way", () => {
    const data = new URLSearchParams("env2[0][key]=A&env[0][key]=B");
    expect(rowsFromFormData(data, "env")).toEqual([{ key: "B", value: "" }]);
  });
});
