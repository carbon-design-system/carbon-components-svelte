import {
  anchorAt,
  readSnapshot,
  scrollForAnchor,
  writeSnapshot,
} from "../../docs/src/catalog-page/catalog-scroll.js";

describe("catalog scroll anchors", () => {
  const geometry = { listTop: 300, stride: 224, columns: 3 };

  it("names the first card in view and puts the reader back on it", () => {
    const anchor = anchorAt({ scrollY: 300 + 224 * 10 + 37, ...geometry });

    expect(anchor).toEqual({ index: 30, within: 37 });
    expect(scrollForAnchor({ ...anchor, ...geometry })).toBe(
      300 + 224 * 10 + 37,
    );
  });

  it("keeps the same card in view when the column count changes", () => {
    const anchor = anchorAt({ scrollY: 300 + 224 * 10 + 37, ...geometry });
    // The window got wider: 5 columns, a shorter row stride is not assumed.
    const back = scrollForAnchor({ ...anchor, ...geometry, columns: 5 });

    // Card 30 is the first card of row 6 at 5 columns.
    expect(back).toBe(300 + 224 * 6 + 37);
    expect(anchorAt({ scrollY: back, ...geometry, columns: 5 }).index).toBe(30);
  });

  it("does not go above the list", () => {
    expect(anchorAt({ scrollY: 0, ...geometry })).toEqual({
      index: 0,
      within: 0,
    });
  });

  it("is saved in the history entry, for its own query only", () => {
    const snapshot = { key: "?q=a", index: 12, within: 4, y: 900 };
    writeSnapshot(snapshot);

    expect(readSnapshot("?q=a")).toEqual(snapshot);
    expect(readSnapshot("?q=b")).toBeNull();
    // The state other code keeps in the entry is not lost.
    history.replaceState({ other: 1, ...history.state }, "");
    expect(readSnapshot("?q=a")).toEqual(snapshot);
  });
});
