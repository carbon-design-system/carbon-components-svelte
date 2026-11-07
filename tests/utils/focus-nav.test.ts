import { clampIndex } from "../../src/utils/clamp-index.js";
import {
  mountedIndexes,
  nextIndex,
  type NextIndexConfig,
  type NextIndexState,
  typeaheadMatch,
} from "../../src/utils/focus-nav.js";
import { moveIndex, nextEnabledIndex } from "../../src/utils/move-index.js";

function go(
  state: Partial<NextIndexState> & { index: number },
  key: string,
  config: NextIndexConfig = {},
  count = state.count ?? 5,
) {
  return nextIndex({ count, ...state }, key, config);
}

const at = (
  state: Partial<NextIndexState> & { index: number },
  key: string,
  config?: NextIndexConfig,
  count?: number,
) => go(state, key, config, count)?.index;

describe("nextIndex: lists", () => {
  describe("which keys each orientation answers to", () => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    it.each([
      ["horizontal", ["ArrowLeft", "ArrowRight"]],
      ["vertical", ["ArrowUp", "ArrowDown"]],
      ["both", keys],
    ] as const)("%s", (orientation, handled) => {
      for (const key of keys) {
        const result = go({ index: 2 }, key, { orientation });
        expect(result !== null).toBe(handled.includes(key));
      }
    });

    it("steps forward on Right/Down and back on Left/Up", () => {
      expect(at({ index: 2 }, "ArrowRight")).toBe(3);
      expect(at({ index: 2 }, "ArrowLeft")).toBe(1);
      expect(at({ index: 2 }, "ArrowDown", { orientation: "vertical" })).toBe(
        3,
      );
      expect(at({ index: 2 }, "ArrowUp", { orientation: "vertical" })).toBe(1);
      expect(at({ index: 2 }, "ArrowDown", { orientation: "both" })).toBe(3);
      expect(at({ index: 2 }, "ArrowLeft", { orientation: "both" })).toBe(1);
    });

    it("ignores keys that are not navigation keys", () => {
      expect(go({ index: 2 }, "a")).toBeNull();
      expect(go({ index: 2 }, "Enter")).toBeNull();
      expect(go({ index: 2 }, "Tab")).toBeNull();
    });

    it("handles nothing for an empty list", () => {
      expect(go({ index: -1 }, "ArrowRight", {}, 0)).toBeNull();
      expect(go({ index: -1 }, "Home", {}, 0)).toBeNull();
    });
  });

  describe("RTL", () => {
    it("swaps Left and Right", () => {
      expect(at({ index: 2 }, "ArrowRight", { rtl: true })).toBe(1);
      expect(at({ index: 2 }, "ArrowLeft", { rtl: true })).toBe(3);
      expect(
        at({ index: 2 }, "ArrowRight", { rtl: true, orientation: "both" }),
      ).toBe(1);
    });

    it("leaves Up and Down, Home and End alone", () => {
      const config = { rtl: true, orientation: "both" } as const;
      expect(at({ index: 2 }, "ArrowDown", config)).toBe(3);
      expect(at({ index: 2 }, "ArrowUp", config)).toBe(1);
      expect(at({ index: 2 }, "Home", config)).toBe(0);
      expect(at({ index: 2 }, "End", config)).toBe(4);
    });

    it("does not make Left/Right work in a vertical list", () => {
      expect(
        go({ index: 2 }, "ArrowLeft", { rtl: true, orientation: "vertical" }),
      ).toBeNull();
    });

    it("wraps toward the inline end", () => {
      // In RTL, Left at the last item wraps to the first.
      expect(at({ index: 4 }, "ArrowLeft", { rtl: true })).toBe(0);
      expect(at({ index: 0 }, "ArrowRight", { rtl: true })).toBe(4);
    });
  });

  describe("wrap", () => {
    it("wraps by default", () => {
      expect(at({ index: 4 }, "ArrowRight")).toBe(0);
      expect(at({ index: 0 }, "ArrowLeft")).toBe(4);
    });

    it("stops at the ends with wrap: false", () => {
      expect(at({ index: 4 }, "ArrowRight", { wrap: false })).toBe(4);
      expect(at({ index: 0 }, "ArrowLeft", { wrap: false })).toBe(0);
    });

    it("a one-item list stays put", () => {
      expect(at({ index: 0 }, "ArrowRight", {}, 1)).toBe(0);
      expect(at({ index: 0 }, "ArrowLeft", {}, 1)).toBe(0);
    });
  });

  describe("entering from no active item", () => {
    it("forward enters at the first, backward at the last", () => {
      expect(at({ index: -1 }, "ArrowRight")).toBe(0);
      expect(at({ index: -1 }, "ArrowLeft")).toBe(4);
      expect(at({ index: -1 }, "ArrowRight", { wrap: false })).toBe(0);
      expect(at({ index: -1 }, "ArrowLeft", { wrap: false })).toBe(4);
    });
  });

  describe("Home and End", () => {
    it("go to the ends, in either orientation", () => {
      for (const orientation of ["horizontal", "vertical", "both"] as const) {
        expect(at({ index: 2 }, "Home", { orientation })).toBe(0);
        expect(at({ index: 2 }, "End", { orientation })).toBe(4);
      }
    });

    it("can be turned off", () => {
      expect(go({ index: 2 }, "Home", { home: false })).toBeNull();
      expect(go({ index: 2 }, "End", { end: false })).toBeNull();
      expect(at({ index: 2 }, "End", { home: false })).toBe(4);
    });
  });

  describe("paging", () => {
    it("is not handled without pageSize", () => {
      expect(go({ index: 2 }, "PageDown")).toBeNull();
      expect(go({ index: 2 }, "PageUp")).toBeNull();
    });

    it("moves pageSize items and clamps without wrapping", () => {
      const config = { pageSize: 3 };
      expect(at({ index: 0 }, "PageDown", config, 10)).toBe(3);
      expect(at({ index: 8 }, "PageDown", config, 10)).toBe(9);
      expect(at({ index: 9 }, "PageDown", config, 10)).toBe(9);
      expect(at({ index: 2 }, "PageUp", config, 10)).toBe(0);
      expect(at({ index: 0 }, "PageUp", config, 10)).toBe(0);
    });

    it("enters at the ends from no active item", () => {
      expect(at({ index: -1 }, "PageDown", { pageSize: 3 }, 10)).toBe(0);
      expect(at({ index: -1 }, "PageUp", { pageSize: 3 }, 10)).toBe(9);
    });

    it("lands on the nearest enabled item past the target, else back toward the start", () => {
      const skip = (i: number) => i >= 4 && i <= 6;
      expect(at({ index: 0 }, "PageDown", { pageSize: 5, skip }, 10)).toBe(7);
      // Past the target nothing is enabled: fall back toward where it started.
      const tail = (i: number) => i >= 4;
      expect(
        at({ index: 0 }, "PageDown", { pageSize: 5, skip: tail }, 10),
      ).toBe(3);
    });
  });

  describe("modifiers", () => {
    it("leaves every key to the browser with Ctrl or Alt", () => {
      for (const key of [
        "ArrowRight",
        "ArrowLeft",
        "Home",
        "End",
        "PageDown",
      ]) {
        expect(go({ index: 2, ctrl: true }, key, { pageSize: 2 })).toBeNull();
        expect(go({ index: 2, alt: true }, key, { pageSize: 2 })).toBeNull();
      }
    });
  });

  describe("skipped items", () => {
    const skip = (i: number) => i === 1 || i === 2 || i === 3;

    it("passes over a cluster in the direction of travel", () => {
      expect(at({ index: 0 }, "ArrowRight", { skip }, 6)).toBe(4);
      expect(at({ index: 4 }, "ArrowLeft", { skip }, 6)).toBe(0);
    });

    it("wraps past a cluster at the ends", () => {
      expect(at({ index: 5 }, "ArrowRight", { skip }, 6)).toBe(0);
      expect(at({ index: 0 }, "ArrowLeft", { skip }, 6)).toBe(5);
    });

    it("stays when nothing is enabled that way and wrap is off", () => {
      expect(
        at({ index: 0 }, "ArrowRight", { skip: (i) => i > 0, wrap: false }, 6),
      ).toBe(0);
      expect(
        at({ index: 5 }, "ArrowLeft", { skip: (i) => i < 5, wrap: false }, 6),
      ).toBe(5);
    });

    it("Home and End go to the first and last enabled item", () => {
      const edges = (i: number) => i < 2 || i > 3;
      expect(at({ index: 2 }, "Home", { skip: edges }, 6)).toBe(2);
      expect(at({ index: 2 }, "End", { skip: edges }, 6)).toBe(3);
    });

    it("answers -1 when every item is skipped", () => {
      expect(at({ index: 2 }, "Home", { skip: () => true })).toBe(-1);
      expect(at({ index: 2 }, "End", { skip: () => true })).toBe(-1);
    });

    it("stays on the active item when every other item is skipped", () => {
      expect(at({ index: 2 }, "ArrowRight", { skip: (i) => i !== 2 })).toBe(2);
      expect(at({ index: 2 }, "ArrowLeft", { skip: (i) => i !== 2 })).toBe(2);
    });

    it("lands on skipped items when no skip is given", () => {
      expect(at({ index: 0 }, "ArrowRight", {}, 6)).toBe(1);
    });
  });

  // The list rules are those of master's `moveIndex`, `clampIndex` and
  // `nextEnabledIndex`, which `rovingFocus` is built on. Check every small
  // case, so moving `rovingFocus` onto `nextIndex` changes nothing.
  describe("parity with the primitives rovingFocus used", () => {
    it("agrees with nextEnabledIndex, moveIndex and clampIndex on every small case", () => {
      let cases = 0;
      for (let count = 1; count <= 5; count++) {
        for (let mask = 0; mask < 1 << count; mask++) {
          const disabled = (i: number) => (mask & (1 << i)) !== 0;
          const items = Array.from({ length: count }, (_, i) => ({
            disabled: disabled(i),
          }));
          for (let index = -1; index < count; index++) {
            for (const wrap of [true, false]) {
              for (const step of [1, -1] as const) {
                const key = step === 1 ? "ArrowRight" : "ArrowLeft";
                const withSkip = nextEnabledIndex({ items, index, step, wrap });
                expect(
                  at({ index }, key, { skip: disabled, wrap }, count),
                ).toBe(withSkip);
                const plain = wrap
                  ? moveIndex(index, step, count)
                  : clampIndex(index, step, count);
                expect(at({ index }, key, { wrap }, count)).toBe(plain);
                cases += 1;
              }
            }
          }
        }
      }
      expect(cases).toBeGreaterThan(1000);
    });
  });
});

describe("nextIndex: grids", () => {
  // 10 cells in 4 columns:
  //   0  1  2  3
  //   4  5  6  7
  //   8  9
  const grid: NextIndexConfig = { orientation: "grid", columns: 4 };
  const move = (
    index: number,
    key: string,
    config: NextIndexConfig = {},
    state = {},
  ) => go({ index, ...state }, key, { ...grid, ...config }, 10);

  describe("arrows", () => {
    it("move within a line and between lines", () => {
      expect(move(5, "ArrowRight")?.index).toBe(6);
      expect(move(5, "ArrowLeft")?.index).toBe(4);
      expect(move(5, "ArrowDown")?.index).toBe(9);
      expect(move(5, "ArrowUp")?.index).toBe(1);
    });

    it("stop at the edges and do not wrap by default", () => {
      expect(move(3, "ArrowRight")?.index).toBe(3);
      expect(move(4, "ArrowLeft")?.index).toBe(4);
      expect(move(1, "ArrowUp")?.index).toBe(1);
      expect(move(9, "ArrowDown")?.index).toBe(9);
    });

    it("wrap within the line and the column with wrap: true", () => {
      expect(move(3, "ArrowRight", { wrap: true })?.index).toBe(0);
      expect(move(0, "ArrowLeft", { wrap: true })?.index).toBe(3);
      expect(move(9, "ArrowRight", { wrap: true })?.index).toBe(8);
      expect(move(1, "ArrowUp", { wrap: true })?.index).toBe(9);
      expect(move(9, "ArrowDown", { wrap: true })?.index).toBe(1);
    });

    it("Left and Right carry on into the next line with flow", () => {
      expect(move(3, "ArrowRight", { flow: true })?.index).toBe(4);
      expect(move(4, "ArrowLeft", { flow: true })?.index).toBe(3);
      expect(move(9, "ArrowRight", { flow: true })?.index).toBe(9);
      expect(move(9, "ArrowRight", { flow: true, wrap: true })?.index).toBe(0);
    });
  });

  describe("the goal column", () => {
    it("clamps to the end of a short last line and remembers the column", () => {
      const down = move(3, "ArrowDown")!;
      expect(down).toEqual({ index: 7, column: 3 });
      const short = move(7, "ArrowDown", {}, { column: down.column })!;
      expect(short).toEqual({ index: 9, column: 3 });
      // The column comes back on the next line up.
      expect(move(9, "ArrowUp", {}, { column: short.column })?.index).toBe(7);
    });

    it("is the column of the cell when none is given", () => {
      expect(move(6, "ArrowUp")?.column).toBe(2);
      expect(move(6, "ArrowRight")?.column).toBe(3);
    });
  });

  describe("Home and End", () => {
    it("go to the ends of the line", () => {
      expect(move(6, "Home")?.index).toBe(4);
      expect(move(6, "End")?.index).toBe(7);
      expect(move(8, "End")?.index).toBe(9);
    });

    it("go to the ends of the grid with Ctrl", () => {
      expect(move(6, "Home", {}, { ctrl: true })?.index).toBe(0);
      expect(move(6, "End", {}, { ctrl: true })?.index).toBe(9);
    });

    it("answer to Alt with nothing", () => {
      expect(move(6, "Home", {}, { alt: true })).toBeNull();
    });
  });

  describe("Ctrl+Arrow", () => {
    it("is not handled by default", () => {
      expect(move(5, "ArrowRight", {}, { ctrl: true })).toBeNull();
      expect(move(5, "ArrowDown", {}, { ctrl: true })).toBeNull();
    });

    it("jumps to the edge of the line or column with ctrlArrows", () => {
      const config = { ctrlArrows: true };
      expect(move(5, "ArrowRight", config, { ctrl: true })?.index).toBe(7);
      expect(move(5, "ArrowLeft", config, { ctrl: true })?.index).toBe(4);
      expect(move(5, "ArrowDown", config, { ctrl: true })?.index).toBe(9);
      expect(move(5, "ArrowUp", config, { ctrl: true })?.index).toBe(1);
      // The last line is short, so the column clamps to its end.
      expect(move(2, "ArrowDown", config, { ctrl: true })?.index).toBe(9);
    });
  });

  describe("paging", () => {
    it("is not handled without pageSize", () => {
      expect(move(5, "PageDown")).toBeNull();
    });

    it("moves pageSize lines, clamped, keeping the column", () => {
      expect(move(1, "PageDown", { pageSize: 2 })?.index).toBe(9);
      expect(move(5, "PageUp", { pageSize: 5 })?.index).toBe(1);
      expect(move(1, "PageDown", { pageSize: 1 })?.index).toBe(5);
    });

    it("moves pageColumns with Alt", () => {
      const config = { pageSize: 2, pageColumns: 2 };
      expect(move(4, "PageDown", config, { alt: true })?.index).toBe(6);
      expect(move(7, "PageUp", config, { alt: true })?.index).toBe(5);
      expect(move(4, "PageDown", { pageSize: 2 }, { alt: true })).toBeNull();
    });

    it("leaves Ctrl+Page keys to the browser", () => {
      expect(move(5, "PageDown", { pageSize: 2 }, { ctrl: true })).toBeNull();
    });
  });

  describe("RTL", () => {
    it("swaps Left and Right, including flow, Ctrl+Arrow and the line ends", () => {
      expect(move(5, "ArrowLeft", { rtl: true })?.index).toBe(6);
      expect(move(5, "ArrowRight", { rtl: true })?.index).toBe(4);
      expect(move(3, "ArrowLeft", { rtl: true, flow: true })?.index).toBe(4);
      expect(
        move(5, "ArrowLeft", { rtl: true, ctrlArrows: true }, { ctrl: true })
          ?.index,
      ).toBe(7);
    });

    it("leaves Up, Down, Home and End alone", () => {
      expect(move(5, "ArrowDown", { rtl: true })?.index).toBe(9);
      expect(move(6, "Home", { rtl: true })?.index).toBe(4);
    });
  });

  describe("entering from no active cell", () => {
    it("enters at the first cell, or the last for a backward key", () => {
      expect(move(-1, "ArrowDown")?.index).toBe(0);
      expect(move(-1, "ArrowRight")?.index).toBe(0);
      expect(move(-1, "Home")?.index).toBe(0);
      expect(move(-1, "ArrowUp")?.index).toBe(9);
      expect(move(-1, "ArrowLeft")?.index).toBe(9);
      expect(move(-1, "End")?.index).toBe(9);
      expect(move(-1, "PageUp", { pageSize: 2 })?.index).toBe(9);
    });

    it("treats an out-of-range index as none", () => {
      expect(move(40, "ArrowDown")?.index).toBe(0);
    });
  });

  describe("skipped cells", () => {
    it("passes over a disabled cluster in a row", () => {
      const skip = (i: number) => i === 5 || i === 6;
      expect(move(4, "ArrowRight", { skip })?.index).toBe(7);
      expect(move(7, "ArrowLeft", { skip })?.index).toBe(4);
    });

    it("stays when the rest of the row is disabled", () => {
      const skip = (i: number) => i > 4 && i < 8;
      expect(move(4, "ArrowRight", { skip })?.index).toBe(4);
    });

    it("passes over a disabled cluster in a column", () => {
      // The whole second line is disabled: Down from the first lands on the third.
      const skip = (i: number) => i >= 4 && i < 8;
      expect(move(1, "ArrowDown", { skip })?.index).toBe(9);
      expect(move(9, "ArrowUp", { skip })?.index).toBe(1);
    });

    it("stays when the column below is disabled to the edge", () => {
      const skip = (i: number) => i >= 4;
      expect(move(1, "ArrowDown", { skip })?.index).toBe(1);
    });

    it("Home and End land on the first and last enabled cell of the line", () => {
      const skip = (i: number) => i === 4 || i === 7;
      expect(move(5, "Home", { skip })?.index).toBe(5);
      expect(move(5, "End", { skip })?.index).toBe(6);
      expect(move(5, "Home", { skip })?.index).toBe(5);
      expect(move(5, "Home", { skip }, { ctrl: true })?.index).toBe(0);
    });

    it("answers -1 for Home on a line that is entirely disabled", () => {
      const skip = (i: number) => i >= 4 && i < 8;
      expect(move(5, "Home", { skip })?.index).toBe(-1);
    });

    it("enters at the first enabled cell from no active cell", () => {
      const skip = (i: number) => i < 3;
      expect(move(-1, "ArrowDown", { skip })?.index).toBe(3);
    });
  });

  describe("uneven lines (layout)", () => {
    // Two sections: 5 cells and 3 cells, 4 columns, each starting a new line.
    //   0 1 2 3
    //   4
    //   5 6 7
    const lines = [
      [0, 4],
      [4, 1],
      [5, 3],
    ];
    const layout = {
      lineCount: lines.length,
      lineOf: (index: number) =>
        lines.findIndex(
          ([start, length]) => index >= start && index < start + length,
        ),
      lineStart: (line: number) => lines[line][0],
      lineLength: (line: number) => lines[line][1],
    };
    const run = (index: number, key: string, state = {}) =>
      go({ index, ...state }, key, { orientation: "grid", layout }, 8);

    it("clamps Down to a short line and brings the column back", () => {
      const first = run(3, "ArrowDown")!;
      expect(first.index).toBe(4);
      const second = run(4, "ArrowDown", { column: first.column })!;
      expect(second.index).toBe(7);
      expect(run(7, "ArrowUp", { column: second.column })?.index).toBe(4);
      expect(run(4, "ArrowUp", { column: 3 })?.index).toBe(3);
    });

    it("moves Home and End by the line", () => {
      expect(run(6, "Home")?.index).toBe(5);
      expect(run(5, "End")?.index).toBe(7);
      expect(run(4, "End")?.index).toBe(4);
    });
  });
});

describe("typeaheadMatch", () => {
  const labels = ["Apple", "Apricot", "Banana", "Bacon", "Berry", "Cherry"];
  const label = (i: number) => labels[i];
  const run = (query: string, from: number, skip?: (i: number) => boolean) =>
    typeaheadMatch({ count: labels.length, query, label, from, skip });

  it("finds the next label with the prefix, after the current one", () => {
    expect(run("a", 0)).toBe(1);
    expect(run("a", 1)).toBe(0);
    expect(run("b", -1)).toBe(2);
    expect(run("b", 2)).toBe(3);
  });

  it("is case-insensitive and wraps once", () => {
    expect(run("c", 4)).toBe(5);
    expect(run("A", 5)).toBe(0);
  });

  it("returns -1 when nothing matches", () => {
    expect(run("z", 0)).toBe(-1);
    expect(run("", 0)).toBe(-1);
  });

  it("keeps the current item while a longer prefix still matches it", () => {
    // "b" lands on Banana; "ba" must stay there, not jump on to Bacon.
    expect(run("ba", 2)).toBe(2);
    expect(run("bac", 2)).toBe(3);
    expect(run("bac", 3)).toBe(3);
  });

  it("skips skipped items", () => {
    expect(run("b", 1, (i) => i === 2)).toBe(3);
    expect(run("b", -1, (i) => i >= 2 && i <= 4)).toBe(-1);
  });
});

describe("mountedIndexes", () => {
  it("is the window when the active item is inside it", () => {
    expect(mountedIndexes(3, 6, 4)).toEqual([3, 4, 5]);
    expect(mountedIndexes(3, 6, -1)).toEqual([3, 4, 5]);
  });

  it("adds the active item before or after the window", () => {
    expect(mountedIndexes(3, 6, 0)).toEqual([0, 3, 4, 5]);
    expect(mountedIndexes(3, 6, 9)).toEqual([3, 4, 5, 9]);
  });
});
