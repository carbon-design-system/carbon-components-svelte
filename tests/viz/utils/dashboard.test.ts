import { get } from "svelte/store";
import {
  createDashboard,
  filterRows,
  withinRange,
} from "../../../src/viz/utils/dashboard.js";

const rows = [
  { region: "EMEA", product: "Cloud", time: new Date(2026, 0, 1), v: 1 },
  { region: "EMEA", product: "Data", time: new Date(2026, 0, 2), v: 2 },
  { region: "APAC", product: "Cloud", time: new Date(2026, 0, 3), v: 3 },
];

describe("createDashboard", () => {
  test("adds a filter once, toggles it off, and keeps rows that match every dimension", () => {
    const board = createDashboard();
    board.filter("region", "EMEA");
    board.filter("region", "EMEA");
    board.filter("product", "Cloud");
    expect(get(board).filters).toHaveLength(2);
    expect(filterRows(rows, get(board).filters).map((r) => r.v)).toEqual([1]);

    board.toggleFilter("product", "Cloud");
    board.filter("region", "APAC");
    expect(filterRows(rows, get(board).filters).map((r) => r.v)).toEqual([
      1, 2, 3,
    ]);

    board.unfilter("region");
    expect(get(board).filters).toEqual([]);
  });

  test("keeps rows inside a range, both ends included", () => {
    expect(
      withinRange(rows, "time", {
        from: new Date(2026, 0, 2),
        to: new Date(2026, 0, 3),
      }).map((r) => r.v),
    ).toEqual([2, 3]);
  });
});
