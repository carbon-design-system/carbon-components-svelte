// @vitest-environment node
import { parseFile } from "../../src/ImportWizard/parse-file.js";
import { xlsxCore } from "../../src/ImportWizard/xlsx-core.js";
import { workbook, zip } from "./xlsx-fixture";

const { parseXlsx } = xlsxCore();

describe("xlsx reader", () => {
  it("reads shared strings, numbers, booleans and inline strings", async () => {
    const file = zip(
      workbook([
        {
          name: "Users",
          rows: [
            ["Name", "Age", "Active", "Note"],
            ["Ada", 36, { b: true }, { inline: "Hi &amp; bye" }],
          ],
        },
      ]),
    );
    const result = await parseXlsx(file);
    expect(result.rows).toEqual([
      ["Name", "Age", "Active", "Note"],
      ["Ada", "36", "TRUE", "Hi & bye"],
    ]);
    expect(result.sheetName).toBe("Users");
  });

  it("converts date-formatted numbers to ISO dates", async () => {
    const file = zip(
      workbook([
        {
          name: "S",
          rows: [
            [
              { n: 45292, style: 1 },
              { n: 45292, style: 2 },
              { n: 45292.5, style: 1 },
              { n: 45292, style: 0 },
              { n: 45292, style: 3 },
              { n: 0.75, style: 1 },
            ],
          ],
        },
      ]),
    );
    const [row] = (await parseXlsx(file)).rows;
    expect(row).toEqual([
      "2024-01-01",
      "2024-01-01",
      "2024-01-01T12:00:00",
      "45292",
      "45292",
      "18:00:00",
    ]);
  });

  it("returns serial numbers on request", async () => {
    const file = zip(
      workbook([{ name: "S", rows: [[{ n: 45292, style: 1 }]] }]),
    );
    expect((await parseXlsx(file, { dates: "serial" })).rows).toEqual([
      ["45292"],
    ]);
  });

  it("honors the 1904 date system", async () => {
    const file = zip(
      workbook([{ name: "S", rows: [[{ n: 1000, style: 1 }]] }], {
        date1904: true,
      }),
    );
    expect((await parseXlsx(file)).rows).toEqual([["1906-09-27"]]);
  });

  it("fills gaps in sparse rows and drops trailing empty rows", async () => {
    const file = zip(
      workbook([
        { name: "S", rows: [["a", null, "c"], [], ["x"], [null, null]] },
      ]),
    );
    expect((await parseXlsx(file)).rows).toEqual([["a", "", "c"], [], ["x"]]);
  });

  it("reads the first visible sheet, or one by name or index", async () => {
    const file = zip(
      workbook([
        { name: "Hidden", rows: [["h"]], state: "hidden" },
        { name: "One", rows: [["1"]] },
        { name: "Two", rows: [["2"]] },
      ]),
    );
    expect((await parseXlsx(file)).sheetName).toBe("One");
    expect((await parseXlsx(file, { sheet: "Two" })).rows).toEqual([["2"]]);
    expect((await parseXlsx(file, { sheet: 1 })).rows).toEqual([["2"]]);
    expect((await parseXlsx(file)).sheets).toEqual(["One", "Two"]);
  });

  it("reads rich text and skips phonetic runs", async () => {
    const files = workbook([{ name: "S", rows: [["x"]] }], {
      sharedExtra:
        '<si><r><t>Rich </t></r><r><t>text</t></r><rPh sb="0"><t>ignored</t></rPh></si>',
    });
    files["xl/worksheets/sheet1.xml"] = files[
      "xl/worksheets/sheet1.xml"
    ].replace("</row>", '<c r="B1" t="s"><v>1</v></c></row>');
    expect((await parseXlsx(zip(files))).rows).toEqual([["x", "Rich text"]]);
  });

  it("decodes entities and _x000D_ escapes", async () => {
    const files = workbook([
      { name: "S", rows: [["a &lt; b &#65; &#x42; _x000D_"]] },
    ]);
    expect((await parseXlsx(zip(files))).rows).toEqual([["a < b A B \r"]]);
  });

  it("reads stored (uncompressed) entries", async () => {
    const file = zip(workbook([{ name: "S", rows: [["ok"]] }]), {
      store: true,
    });
    expect((await parseXlsx(file)).rows).toEqual([["ok"]]);
  });

  it("falls back to sheetN.xml without relationships", async () => {
    const files = workbook([{ name: "S", rows: [["ok"]] }]);
    const { "xl/_rels/workbook.xml.rels": _rels, ...rest } = files;
    expect((await parseXlsx(zip(rest))).rows).toEqual([["ok"]]);
  });

  it("stops at maxRows", async () => {
    const rows = Array.from({ length: 10 }, (_, i) => [String(i)]);
    const file = zip(workbook([{ name: "S", rows }]));
    expect((await parseXlsx(file, { maxRows: 3 })).rows).toHaveLength(3);
  });

  it("rejects what it cannot read", async () => {
    await expect(parseXlsx(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow(
      "Not a zip file",
    );
    await expect(parseXlsx(zip({ "other.txt": "x" }))).rejects.toThrow(
      "Not an .xlsx workbook",
    );
    await expect(
      parseXlsx(
        zip(workbook([{ name: "S", rows: [["x"]] }]), { encrypt: true }),
      ),
    ).rejects.toThrow("password protected");
  });

  it("refuses a sheet that inflates past the limit", async () => {
    const big = zip(workbook([{ name: "S", rows: [["x".repeat(50_000)]] }]));
    await expect(parseXlsx(big, { maxBytes: 1000 })).rejects.toThrow(
      "too large",
    );
  });
});

describe("parseFile (xlsx)", () => {
  it("detects an .xlsx by its signature", async () => {
    const bytes = zip(
      workbook([
        {
          name: "People",
          rows: [
            ["a", "b"],
            ["1", "2"],
          ],
        },
      ]),
    );
    const result = await parseFile(
      new File([bytes as BlobPart], "people.dat"),
      {
        worker: false,
      },
    );
    expect(result).toMatchObject({
      format: "xlsx",
      sheetName: "People",
      rows: [
        ["a", "b"],
        ["1", "2"],
      ],
    });
  });
});
