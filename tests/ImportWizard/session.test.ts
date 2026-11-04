// @vitest-environment node
import {
  createImportSession,
  ROW_ERROR,
} from "../../src/ImportWizard/session.js";
import { toTable } from "../../src/ImportWizard/table.js";

const fields = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", type: "email" as const, required: true },
  {
    key: "role",
    label: "Role",
    type: "enum" as const,
    options: ["admin", "member"],
  },
  { key: "age", label: "Age", type: "integer" as const, min: 18 },
];

function make(
  records: string[][],
  extra: Partial<Parameters<typeof createImportSession>[0]> = {},
) {
  // The session edits rows in place.
  const table = toTable(records.map((r) => r.slice()));
  return createImportSession({
    fields,
    headers: table.headers,
    rows: table.rows,
    long: table.long,
    mapping: ["name", "email", "role", "age"].slice(0, table.headers.length),
    keyField: "email",
    ...extra,
  });
}

const base = [
  ["Name", "Email", "Role", "Age"],
  ["Ada", "ada@example.com", "admin", "36"],
  ["Grace", "grace@example", "member", "40"],
  ["", "alan@example.com", "guest", "17"],
  ["Ada 2", "ADA@example.com", "member", ""],
];

describe("import session", () => {
  it("finds the problems per cell and per row", async () => {
    const session = make(base);
    await session.validate();
    expect(session.problems(1)).toEqual({
      email: "Enter a valid email address",
    });
    expect(session.problems(2)).toEqual({
      name: "Name is required",
      role: "Use one of: admin, member",
      age: "Use 18 or more",
    });
    expect(session.errorIds()).toEqual([1, 2]);
  });

  it("counts valid rows, errors and duplicates", async () => {
    const session = make(base);
    await session.validate();
    expect(session.summary()).toEqual({
      total: 4,
      valid: 1,
      errors: 2,
      duplicates: 1,
      removed: 0,
    });
    expect(session.problems(3)).toEqual({ email: "Duplicate of row 2" });
  });

  it("counts a duplicate as an error with duplicates: error, and not at all with keep", async () => {
    const asError = make(base, { duplicates: "error" });
    await asError.validate();
    expect(asError.summary()).toMatchObject({
      errors: 3,
      duplicates: 0,
      valid: 1,
    });
    const kept = make(base, { duplicates: "keep" });
    await kept.validate();
    expect(kept.summary()).toMatchObject({
      errors: 2,
      duplicates: 0,
      valid: 2,
    });
  });

  it("revalidates a row after a cell edit", async () => {
    const session = make(base);
    await session.validate();
    session.setCell(1, "email", "grace@example.com");
    expect(session.problems(1)).toEqual({});
    expect(session.summary().valid).toBe(2);
  });

  it("recomputes duplicates when the key changes", async () => {
    const session = make(base);
    await session.validate();
    session.setCell(3, "email", "ada.two@example.com");
    expect(session.summary().duplicates).toBe(0);
    session.setCell(1, "email", "ada@example.com");
    session.setCell(1, "name", "Grace");
    expect(session.problems(1)).toEqual({ email: "Duplicate of row 2" });
  });

  it("removes rows, and a removed first row frees its duplicate", async () => {
    const session = make(base);
    await session.validate();
    session.removeRows([0]);
    expect(session.summary()).toMatchObject({
      total: 3,
      removed: 1,
      duplicates: 0,
    });
    expect(session.isRemoved(0)).toBe(true);
  });

  it("removes every row with a problem", async () => {
    const session = make(base);
    await session.validate();
    session.removeErrorRows();
    expect(session.summary()).toEqual({
      total: 2,
      valid: 1,
      errors: 0,
      duplicates: 1,
      removed: 2,
    });
  });

  it("flags rows with more cells than the header", async () => {
    const session = make([
      ["Name", "Email"],
      ["Ada", "ada@example.com", "extra"],
      ["Grace", "grace@example.com"],
    ]);
    await session.validate();
    expect(session.problems(0)[ROW_ERROR]).toBe(
      "Has 3 values, but the header has 2",
    );
    expect(session.summary().errors).toBe(1);
  });

  it("replaces text in the cells that have a problem", async () => {
    const session = make([
      ["Name", "Email", "Role"],
      ["A", "a@x.com", "Administrator"],
      ["B", "b@x.com", "administrator"],
      ["C", "c@x.com", "member"],
    ]);
    await session.validate();
    expect(session.errorIds()).toEqual([0, 1]);
    const changed = session.replaceInColumn("role", {
      find: "administrator",
      replace: "admin",
      whole: true,
    });
    expect(changed).toBe(2);
    expect(session.summary().errors).toBe(0);
  });

  it("replaces a part of the cell, as plain text", async () => {
    const session = make([
      ["Name", "Email"],
      ["A", "a(at)x.com"],
      ["B", "b(at)x.com"],
    ]);
    await session.validate();
    expect(
      session.replaceInColumn("email", { find: "(at)", replace: "@" }),
    ).toBe(2);
    expect(session.summary().valid).toBe(2);
  });

  it("runs cross-field validation after conversion", async () => {
    const session = make(base, {
      fields: [
        ...fields.slice(0, 3),
        {
          key: "age",
          label: "Age",
          type: "integer",
          validate: (value, record) =>
            record.role === "admin" && value !== null && value < 21
              ? "Admins are 21 or older"
              : undefined,
        },
      ],
      mapping: ["name", "email", "role", "age"],
    });
    session.setCell(0, "age", "20");
    await session.validate();
    expect(session.problems(0)).toEqual({ age: "Admins are 21 or older" });
  });

  it("takes a row-level check", async () => {
    const session = make(base, {
      validateRow: (record) =>
        record.name === "Ada" ? "Ada is already a user" : undefined,
    });
    await session.validate();
    expect(session.problems(0)).toEqual({
      [ROW_ERROR]: "Ada is already a user",
    });
  });

  it("ignores unmapped columns", async () => {
    const session = make(base, { mapping: ["name", "email", null, null] });
    await session.validate();
    expect(session.problems(2)).toEqual({ name: "Name is required" });
    expect(session.toRecord(0)).toEqual({
      name: "Ada",
      email: "ada@example.com",
    });
  });

  it("validates in slices and can be aborted", async () => {
    const records = [["Name", "Email"]];
    for (let i = 0; i < 20000; i++)
      records.push([`n${i}`, `u${i}@example.com`]);
    const session = make(records, { mapping: ["name", "email"] });
    const progress: number[] = [];
    await session.validate({
      sliceMs: 0,
      onProgress: (done) => progress.push(done),
    });
    expect(progress.length).toBeGreaterThan(2);
    expect(session.summary().valid).toBe(20000);

    const controller = new AbortController();
    const again = session.validate({
      sliceMs: 0,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    });
    await expect(again).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("import run", () => {
  const rows = [["Name", "Email"]];
  for (let i = 0; i < 10; i++) rows.push([`n${i}`, `u${i}@example.com`]);
  rows.push(["bad", "nope"]);
  rows.push(["dup", "U1@example.com"]);

  const build = async () => {
    const session = make(rows, { mapping: ["name", "email"] });
    await session.validate();
    return session;
  };

  it("hands the valid rows over in chunks and reports progress", async () => {
    const session = await build();
    const sizes: number[] = [];
    const progress: number[] = [];
    const result = await session.run(
      (records, context) => {
        sizes.push(records.length);
        expect(context.chunks).toBe(4);
      },
      { chunkSize: 3, onProgress: (p) => progress.push(p.done) },
    );
    expect(sizes).toEqual([3, 3, 3, 1]);
    expect(progress).toEqual([3, 6, 9, 10]);
    expect(result).toMatchObject({
      imported: 10,
      failed: [],
      canceled: false,
      remaining: 0,
    });
  });

  it("sends converted records", async () => {
    const session = await build();
    let first: unknown;
    await session.run((records) => {
      first ??= records[0];
    });
    expect(first).toEqual({ name: "n0", email: "u0@example.com" });
  });

  it("fails the rows of a chunk that throws and goes on", async () => {
    const session = await build();
    const result = await session.run(
      (_, { chunk }) => {
        if (chunk === 1) throw new Error("Server said no");
      },
      { chunkSize: 4 },
    );
    expect(result.imported).toBe(6);
    expect(result.failed).toHaveLength(4);
    expect(result.failed[0]).toEqual({
      index: 4,
      row: 6,
      message: "Server said no",
    });
  });

  it("stops at the first failed chunk with stopOnError", async () => {
    const session = await build();
    const result = await session.run(
      () => {
        throw new Error("down");
      },
      { chunkSize: 4, stopOnError: true },
    );
    expect(result).toMatchObject({ imported: 0, remaining: 6 });
    expect(result.failed).toHaveLength(4);
  });

  it("fails single rows named in the reply", async () => {
    const session = await build();
    const result = await session.run(
      () => ({
        errors: [
          { index: 1, message: "Taken" },
          { index: 1, message: "again" },
        ],
      }),
      { chunkSize: 5 },
    );
    expect(result.imported).toBe(8);
    expect(result.failed.map((f) => f.message)).toEqual(["Taken", "Taken"]);
  });

  it("cancels between chunks and counts what was left", async () => {
    const session = await build();
    const controller = new AbortController();
    const result = await session.run(
      () => {
        controller.abort();
      },
      { chunkSize: 4, signal: controller.signal },
    );
    expect(result).toMatchObject({ imported: 4, canceled: true, remaining: 6 });
  });

  it("treats a rejection after an abort as a cancel, not a failure", async () => {
    const session = await build();
    const controller = new AbortController();
    const result = await session.run(
      () => {
        controller.abort();
        throw new DOMException("Aborted", "AbortError");
      },
      { chunkSize: 4, signal: controller.signal },
    );
    expect(result).toMatchObject({ canceled: true, failed: [] });
  });

  it("reports the rows that weren't imported", async () => {
    const session = await build();
    const result = await session.run(
      (_, { chunk }) => {
        if (chunk === 0) throw new Error("Timeout");
      },
      { chunkSize: 10 },
    );
    const report = session.report(result);
    expect(report.headers).toEqual(["Row", "Problem", "Name", "Email"]);
    expect(report.rows).toHaveLength(12);
    const bad = report.rows.find((r) => r[2] === "bad");
    expect(bad?.slice(0, 2)).toEqual([
      "12",
      "Email: Enter a valid email address",
    ]);
    expect(report.rows.find((r) => r[2] === "dup")?.[1]).toBe(
      "Email: Duplicate of row 3",
    );
  });

  it("reports only the problems before an import", async () => {
    const session = await build();
    expect(session.report().rows.map((r) => r[0])).toEqual(["12", "13"]);
  });
});
