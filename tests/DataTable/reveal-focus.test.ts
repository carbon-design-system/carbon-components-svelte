import {
  computeReveal,
  revealFocus,
} from "../../src/DataTable/reveal-focus.js";
import { rect } from "../utils/rect";

const port = { left: 0, right: 400, top: 0, bottom: 300 };
const cover = { left: 100, right: 0, top: 40 };

function box(left: number, top: number, width = 80, height = 40) {
  return { left, top, right: left + width, bottom: top + height };
}

describe("computeReveal", () => {
  it("leaves an element in the clear where it is", () => {
    expect(computeReveal(box(150, 60), port, cover)).toEqual({ dx: 0, dy: 0 });
  });

  it("scrolls an element out from under the pinned column", () => {
    expect(computeReveal(box(40, 60), port, cover)).toEqual({ dx: -60, dy: 0 });
  });

  it("scrolls an element out from under the sticky header", () => {
    expect(computeReveal(box(150, 10), port, cover)).toEqual({
      dx: 0,
      dy: -30,
    });
  });

  it("scrolls in an element past the far edges", () => {
    expect(computeReveal(box(350, 280), port, cover)).toEqual({
      dx: 30,
      dy: 20,
    });
  });

  it("stops an element wider than the room at the pin, not past it", () => {
    // Right edge 650 is 250 out, but the leading edge (150) is only 50 from the pin.
    expect(computeReveal(box(150, 60, 500), port, cover).dx).toBe(50);
  });

  it("reserves the end side for a column pinned there", () => {
    const end = { left: 0, right: 100, top: 0 };

    expect(computeReveal(box(280, 60), port, end).dx).toBe(60);
  });

  it("does not scroll a pinned element sideways", () => {
    expect(computeReveal(box(0, 60), port, cover, true)).toEqual({
      dx: 0,
      dy: 0,
    });
  });
});

describe("revealFocus", () => {
  function setup(stickyHeader = true) {
    document.body.innerHTML = `
      <section class="bx--data-table_inner-container">
        <table class="${stickyHeader ? "bx--data-table--sticky-header" : ""}">
          <thead><tr>
            <th class="bx--table-column--pinned-start-edge"></th>
            <th></th>
          </tr></thead>
          <tbody><tr><td tabindex="0"></td></tr></tbody>
        </table>
      </section>`;
    const container = document.querySelector("section") as HTMLElement;
    for (const [name, value] of [
      ["clientWidth", 400],
      ["clientHeight", 300],
    ] as const) {
      Object.defineProperty(container, name, { value });
    }
    container.getBoundingClientRect = () => rect({ width: 400, height: 300 });
    const [pin] = document.querySelectorAll("th");
    pin.getBoundingClientRect = () => rect({ width: 100, height: 40 });
    return { container, cell: document.querySelector("td") as HTMLElement };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls a cell hidden behind the pinned column and header into view", () => {
    const { container, cell } = setup();
    cell.getBoundingClientRect = () =>
      rect({ left: 20, top: 10, width: 80, height: 40 });
    container.scrollLeft = 500;
    container.scrollTop = 200;

    revealFocus(cell);

    expect(container.scrollLeft).toBe(420);
    expect(container.scrollTop).toBe(170);
  });

  it("does nothing when nothing sticks over the region", () => {
    document.body.innerHTML = `<div class="bx--data-table-content"><table><tbody><tr><td tabindex="0"></td></tr></tbody></table></div>`;
    const container = document.querySelector("div") as HTMLElement;
    const cell = document.querySelector("td") as HTMLElement;
    cell.getBoundingClientRect = () =>
      rect({ left: -50, width: 80, height: 40 });
    container.scrollLeft = 500;

    revealFocus(cell);

    expect(container.scrollLeft).toBe(500);
  });

  it("treats a column pinned on the right as covering the right", () => {
    const { container, cell } = setup(false);
    const [pin] = document.querySelectorAll("th");
    pin.getBoundingClientRect = () =>
      rect({ left: 300, width: 100, height: 40 });
    cell.getBoundingClientRect = () =>
      rect({ left: 330, top: 100, width: 60, height: 40 });
    container.scrollLeft = 100;

    revealFocus(cell);

    // The cell's right edge (390) clears the pin's left edge (300) by 90.
    expect(container.scrollLeft).toBe(190);
  });
});
