// @vitest-environment node
import {
  appendNewItems,
  captureAnchor,
  defaultGetKey,
  loadPagesTogether,
  loadsOnScroll,
  parseSnapshot,
  reachedCap,
  scrollDeltaForAnchor,
  setSize,
  snapshotStorageKey,
} from "../../src/utils/infinite-list.js";

const rect = (top: number, bottom: number) => ({
  getBoundingClientRect: () => ({ top, bottom }),
});

describe("infinite-list", () => {
  describe("appendNewItems", () => {
    it("adds only the items it does not hold, in order", () => {
      const byKey = new Map<string | number, { id: number }>();
      expect(
        appendNewItems(byKey, [{ id: 1 }, { id: 2 }], defaultGetKey, 0),
      ).toEqual([1, 2]);
      expect(
        appendNewItems(
          byKey,
          [{ id: 2 }, { id: 3 }, { id: 3 }],
          defaultGetKey,
          2,
        ),
      ).toEqual([3]);
      expect([...byKey.keys()]).toEqual([1, 2, 3]);
    });

    it("keys an item with no id by its place in the list", () => {
      const byKey = new Map<string | number, string>();
      expect(appendNewItems(byKey, ["a", "b"], defaultGetKey, 3)).toEqual([
        3, 4,
      ]);
    });
  });

  it("loads on scroll by mode", () => {
    expect(loadsOnScroll({ mode: "button", autoPages: 3, pageCount: 1 })).toBe(
      false,
    );
    expect(loadsOnScroll({ mode: "auto", autoPages: 0, pageCount: 90 })).toBe(
      true,
    );
    const mode = "auto-then-button" as const;
    expect(loadsOnScroll({ mode, autoPages: 2, pageCount: 1 })).toBe(true);
    expect(loadsOnScroll({ mode, autoPages: 2, pageCount: 2 })).toBe(true);
    expect(loadsOnScroll({ mode, autoPages: 2, pageCount: 3 })).toBe(false);
  });

  it("detects the cap", () => {
    expect(reachedCap(199, 200)).toBe(false);
    expect(reachedCap(200, 200)).toBe(true);
    expect(reachedCap(10_000, undefined)).toBe(false);
  });

  it("sizes the set: the total, the count at the end, else -1", () => {
    expect(setSize({ count: 20, total: 4000, hasMore: true })).toBe(4000);
    expect(setSize({ count: 20, total: undefined, hasMore: true })).toBe(-1);
    expect(setSize({ count: 20, total: 10, hasMore: true })).toBe(-1);
    expect(setSize({ count: 20, total: undefined, hasMore: false })).toBe(20);
  });

  describe("captureAnchor", () => {
    const column = Array.from({ length: 100 }, (_, i) =>
      rect(i * 50 - 130, i * 50 - 80),
    );

    it("finds the first item still below the top edge", () => {
      // Item 2 ends at 20px, item 1 at -30px.
      expect(captureAnchor(column, 0)).toEqual({ index: 2, offset: -30 });
    });

    it("measures from the top of a scroll container", () => {
      expect(captureAnchor(column, 100)).toEqual({ index: 4, offset: -30 });
    });

    it("reads a handful of rects, not the list", () => {
      const reads = vi.fn();
      const counted = column.map((item) => ({
        getBoundingClientRect: () => {
          reads();
          return item.getBoundingClientRect();
        },
      }));
      captureAnchor(counted, 0);
      expect(reads.mock.calls.length).toBeLessThan(10);
    });

    it("returns the last item when all are above, and null when empty", () => {
      expect(captureAnchor(column, 9000)?.index).toBe(99);
      expect(captureAnchor([], 0)).toBeNull();
    });
  });

  it("scrolls so the anchor returns to its offset", () => {
    // The item is at 700 and belongs 40px from the top of the page.
    expect(scrollDeltaForAnchor(700, 0, 40)).toBe(660);
    // Partly above the edge, in a container whose top is at 100.
    expect(scrollDeltaForAnchor(300, 100, -30)).toBe(230);
  });

  describe("parseSnapshot", () => {
    const good = {
      v: 1,
      cursors: [null, "a", "b"],
      anchorKey: "k",
      offset: -4,
      y: 1200,
    };

    it("reads what it wrote", () => {
      expect(parseSnapshot(JSON.stringify(good))).toEqual(good);
    });

    it.each([
      ["nothing", null],
      ["text", "{"],
      ["another version", JSON.stringify({ ...good, v: 2 })],
      ["no cursors", JSON.stringify({ ...good, cursors: [] })],
      ["too many cursors", JSON.stringify({ ...good, cursors: Array(201) })],
      ["an object key", JSON.stringify({ ...good, anchorKey: {} })],
      [
        "an offset that is not a number",
        JSON.stringify({ ...good, offset: "1" }),
      ],
    ])("rejects %s", (_, raw) => {
      expect(parseSnapshot(raw)).toBeNull();
    });
  });

  it("names the snapshot by list and history entry", () => {
    expect(snapshotStorageKey("/search?q=a", "abc")).toBe(
      "ccs:infinite-list:/search?q=a:abc",
    );
  });

  describe("loadPagesTogether", () => {
    it("keeps the order whichever answers first", async () => {
      const loadPage = vi.fn(
        (cursor: unknown) =>
          new Promise<string>((resolve) =>
            setTimeout(() => resolve(`page ${cursor}`), 10 - Number(cursor)),
          ),
      );
      const result = await loadPagesTogether(loadPage, [1, 2, 3, 4, 5], 3);
      expect(result.pages).toEqual([
        "page 1",
        "page 2",
        "page 3",
        "page 4",
        "page 5",
      ]);
      expect(result.failed).toBe(false);
    });

    it("asks for no more than `concurrency` at once", async () => {
      let open = 0;
      let most = 0;
      const loadPage = async () => {
        most = Math.max(most, ++open);
        await new Promise((resolve) => setTimeout(resolve, 1));
        open--;
        return 1;
      };
      await loadPagesTogether(loadPage, [1, 2, 3, 4, 5, 6, 7], 3);
      expect(most).toBe(3);
    });

    it("stops at the first failure with the pages before it", async () => {
      const loadPage = (cursor: unknown) =>
        cursor === 3
          ? Promise.reject(new Error("boom"))
          : Promise.resolve(cursor);
      const result = await loadPagesTogether(loadPage, [1, 2, 3, 4], 4);
      expect(result.pages).toEqual([1, 2]);
      expect(result.failed).toBe(true);
      expect(result.error).toEqual(new Error("boom"));
    });
  });
});
