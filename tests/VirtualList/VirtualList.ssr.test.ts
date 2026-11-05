// @vitest-environment node

import { renderRaw } from "../utils/ssr";
import VirtualList from "./VirtualListOps.test.svelte";

const rowsIn = (html: string) =>
  Array.from(html.matchAll(/data-testid="row-(\d+)"/g), (match) =>
    Number(match[1]),
  );

describe("VirtualList server render", () => {
  it("renders the first window", () => {
    const rows = rowsIn(renderRaw(VirtualList, {}));

    // 100px of 20px rows, two of overscan below.
    expect(rows[0]).toBe(0);
    expect(rows.at(-1)).toBe(6);
  });

  it("renders the window the reader will see for initialScrollTop, with no shift", () => {
    const html = renderRaw(VirtualList, { initialScrollTop: 5000 });
    const rows = rowsIn(html);

    // Rows 250 to 254 are in view, with two of overscan each side.
    expect(rows[0]).toBe(248);
    expect(rows.at(-1)).toBe(256);
    // The window sits where those rows are, inside a spacer of the whole list.
    expect(html).toContain("height: 20000px");
    expect(html).toContain("translateY(4960px)");
  });

  it("renders the end of a list that follows it", () => {
    const rows = rowsIn(renderRaw(VirtualList, { follow: "end" }));

    expect(rows.at(-1)).toBe(999);
  });

  it("renders the pinned item of a sticky list for the scroll position", () => {
    const html = renderRaw(VirtualList, {
      initialScrollTop: 3000,
      stickyIndices: [0, 100, 200],
    });

    // Row 100 starts at 2000, so it is the one pinned, and only once.
    expect(rowsIn(html).filter((row) => row === 100)).toEqual([100]);
    expect(html).toContain("position: sticky");
  });

  it("renders an item to keep mounted wherever the window is", () => {
    const rows = rowsIn(renderRaw(VirtualList, { keepMounted: [900] }));

    expect(rows).toContain(900);
    expect(rows).toContain(0);
  });
});
