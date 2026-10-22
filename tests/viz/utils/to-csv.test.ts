import { groupsToCsv } from "../../../src/viz/utils/to-csv.js";

const group = (key: string, xs: number[], ys: number[], hidden = false) => ({
  key,
  rows: [],
  xs,
  ys,
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

  test("uses custom column names", () => {
    expect(groupsToCsv([], { header: ["date", "region", "revenue"] })).toBe(
      "date,region,revenue\r\n",
    );
  });
});
