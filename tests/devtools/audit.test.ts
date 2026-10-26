import { carbonOwned, cssPath } from "../../src/devtools/audit.js";
import { targetConflicts } from "../../src/devtools/geometry.js";
import { nearestSpacing } from "../../src/devtools/spacing.js";

function mount(html: string) {
  document.body.innerHTML = html;
  return (selector: string) => document.querySelector(selector) as Element;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("carbonOwned", () => {
  test("is true for an element with a bx-- class", () => {
    const $ = mount(`<button class="bx--btn">Go</button>`);
    expect(carbonOwned($("button"))).toBe(true);
  });

  test("walks up through bare elements to the nearest styled one", () => {
    const $ = mount(
      `<table class="bx--data-table"><tbody><tr><td><span>x</span></td></tr></tbody></table>`,
    );
    expect(carbonOwned($("td"))).toBe(true);
    expect(carbonOwned($("span"))).toBe(true);
  });

  test("is false for the app's classes and inline styles", () => {
    const $ = mount(
      `<div class="bx--col"><p class="svelte-abc">a</p><span style="color: red">b</span></div>`,
    );
    expect(carbonOwned($("p"))).toBe(false);
    expect(carbonOwned($("span"))).toBe(false);
  });

  test("is false at the page root", () => {
    const $ = mount("<p>a</p>");
    expect(carbonOwned($("p"))).toBe(false);
  });

  test("shares answers through a cache", () => {
    const $ = mount(`<ul class="bx--list"><li><a>1</a></li></ul>`);
    const cache = new Map<Element, boolean>();
    expect(carbonOwned($("a"), cache)).toBe(true);
    expect(cache.get($("li"))).toBe(true);
  });
});

describe("cssPath", () => {
  test("stops at a stable id or a test id", () => {
    const $ = mount(
      `<main id="app"><section data-testid="card"><p class="note">x</p></section></main>`,
    );
    expect(cssPath($("p"))).toBe(`[data-testid="card"] > p.note`);
    expect(cssPath($("section"))).toBe(`[data-testid="card"]`);
  });

  test("skips generated ids, alone or after a prefix", () => {
    const $ = mount(
      `<div id="combo-ccs-ab12cd34"><input id="ccs-zz99yy88" class="bx--text-input" /></div>`,
    );
    expect(cssPath($("input"))).toBe("div > input.bx--text-input");
  });

  test("skips Svelte's scoped classes", () => {
    const $ = mount(`<div class="svelte-1x2y card"><b>x</b></div>`);
    expect(cssPath($("b"))).toBe("div.card > b");
  });
});

describe("nearestSpacing", () => {
  test("suggests the closest token", () => {
    expect(nearestSpacing(13)).toEqual({ token: "spacing-04", px: 12 });
    expect(nearestSpacing(15)).toEqual({ token: "spacing-05", px: 16 });
    expect(nearestSpacing(-20)).toEqual({ token: "spacing-05", px: -16 });
  });

  test("follows the root font size", () => {
    expect(nearestSpacing(19, 20)).toEqual({ token: "spacing-05", px: 20 });
  });
});

describe("targetConflicts", () => {
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
  });

  test("names the target that crowds most and the room it needs", () => {
    // Centers 20px apart: the circles need 24, so 4px more.
    expect(
      targetConflicts([box(0, 0, 16, 16), box(20, 0, 16, 16)], 24),
    ).toEqual([
      { index: 0, by: 1, needs: 4 },
      { index: 1, by: 0, needs: 4 },
    ]);
  });

  test("passes spaced targets", () => {
    expect(
      targetConflicts([box(0, 0, 16, 16), box(100, 0, 16, 16)], 24),
    ).toEqual([]);
  });
});
