import { pivotLonger } from "../../../src/viz/utils/pivot-longer.js";

describe("pivotLonger", () => {
  test("defaults namesTo to 'series' and valuesTo to 'value'", () => {
    const rows = [{ month: "Jan", emea: 4, apac: 7 }];
    expect(pivotLonger(rows, { cols: ["emea", "apac"] })).toEqual([
      { month: "Jan", series: "emea", value: 4 },
      { month: "Jan", series: "apac", value: 7 },
    ]);
  });

  test("accepts custom namesTo/valuesTo", () => {
    const rows = [{ month: "Jan", emea: 4 }];
    expect(
      pivotLonger(rows, {
        cols: ["emea"],
        namesTo: "region",
        valuesTo: "amount",
      }),
    ).toEqual([{ month: "Jan", region: "emea", amount: 4 }]);
  });

  test("copies non-pivoted keys onto each output row", () => {
    const rows = [{ month: "Jan", year: 2024, emea: 4, apac: 7 }];
    const out = pivotLonger(rows, { cols: ["emea", "apac"] });
    expect(out[0].year).toBe(2024);
    expect(out[1].year).toBe(2024);
  });

  test("outputs row-major order: all columns of a row before the next row", () => {
    const rows = [
      { month: "Jan", emea: 4, apac: 7 },
      { month: "Feb", emea: 5, apac: 8 },
    ];
    const out = pivotLonger(rows, { cols: ["emea", "apac"] });
    expect(out.map((row) => `${row.month}-${row.series}`)).toEqual([
      "Jan-emea",
      "Jan-apac",
      "Feb-emea",
      "Feb-apac",
    ]);
  });

  test("empty rows produce an empty array", () => {
    expect(pivotLonger([], { cols: ["emea"] })).toEqual([]);
  });

  test("does not mutate the input", () => {
    const rows = [{ month: "Jan", emea: 4 }];
    const snapshot = JSON.parse(JSON.stringify(rows));
    pivotLonger(rows, { cols: ["emea"] });
    expect(rows).toEqual(snapshot);
  });
});
