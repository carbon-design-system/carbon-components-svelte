import { groupsToCsv, groupsToRows } from "../../../src/viz/utils/to-csv.js";

const group = (key: string, xs: number[], ys: number[], hidden = false) => ({
  key,
  rows: [],
  xs,
  ys,
  keys: xs,
  color: "",
  hidden,
});

describe("groupsToCsv", () => {
  test("writes one row per x and series, in long format", () => {
    expect(
      groupsToCsv([group("a", [1, 2], [10, 20]), group("b", [1], [5])]),
    ).toBe("x,series,y\r\n1,a,10\r\n2,a,20\r\n1,b,5\r\n");
  });

  test("writes dates as ISO 8601 and categories by label", () => {
    expect(
      groupsToCsv([group("a", [Date.UTC(2026, 0, 1)], [1])], { kind: "time" }),
    ).toContain("2026-01-01T00:00:00.000Z,a,1");
    expect(
      groupsToCsv([group("a", [1], [7])], {
        kind: "category",
        categories: ["Q1", "Q2"],
      }),
    ).toContain("Q2,a,7");
  });

  test("leaves a missing value empty and hidden series out", () => {
    const csv = groupsToCsv([
      group("a", [1], [Number.NaN]),
      group("h", [1], [9], true),
    ]);

    expect(csv).toBe("x,series,y\r\n1,a,\r\n");
  });

  test("quotes commas, quotes, and line breaks", () => {
    expect(groupsToCsv([group('North, "EU"', [1], [2])])).toContain(
      '1,"North, ""EU""",2',
    );
    expect(
      groupsToCsv([group("a", [0], [1])], {
        kind: "category",
        categories: ["line\nbreak"],
      }),
    ).toContain('"line\nbreak",a,1');
  });

  test("leaves ghosts out, keeps to the zoom window, and quotes a formula", () => {
    const csv = groupsToCsv(
      [
        { ...group("=SUM(A1)", [1, 2, 3], [1, 2, 3]) },
        { ...group("a", [1, 2], [1, 2]), ghost: "a" },
      ],
      { range: [2, 3] },
    );

    expect(csv).toBe("x,series,y\r\n2,'=SUM(A1),2\r\n3,'=SUM(A1),3\r\n");
  });

  test("separates with a tab for TSV, and lists the rows for JSON", () => {
    expect(groupsToCsv([group("a,b", [1], [2])], { delimiter: "\t" })).toBe(
      "x\tseries\ty\r\n1\ta,b\t2\r\n",
    );
    expect(groupsToRows([group("a", [1, 2], [2, Number.NaN])])).toEqual([
      { x: 1, series: "a", y: 2 },
      { x: 2, series: "a", y: null },
    ]);
  });

  test("uses custom column names", () => {
    expect(groupsToCsv([], { header: ["date", "region", "revenue"] })).toBe(
      "date,region,revenue\r\n",
    );
  });
});
