// @vitest-environment node
import { resolveIdSelection } from "../../src/utils/resolve-id-selection.js";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("resolveIdSelection", () => {
  it("resolves the index of a found id", () => {
    expect(
      resolveIdSelection({ items, selectedId: "b", currentIndex: 0 }),
    ).toEqual({ index: 1, id: "b" });
  });

  it("keeps the same index when the selected item is already first", () => {
    expect(
      resolveIdSelection({ items, selectedId: "a", currentIndex: 2 }),
    ).toEqual({ index: 0, id: "a" });
  });

  it("clamps and re-anchors when the id is missing and items remain", () => {
    expect(
      resolveIdSelection({ items, selectedId: "missing", currentIndex: 5 }),
    ).toEqual({ index: 2, id: "c" });
  });

  it("returns null when the id is missing and items is empty", () => {
    expect(
      resolveIdSelection({ items: [], selectedId: "missing", currentIndex: 0 }),
    ).toBeNull();
  });
});
