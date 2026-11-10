import {
  HIGHLIGHT_NAME,
  highlightText,
  supportsHighlightApi,
} from "../../src/utils/highlight-api.js";

class FakeHighlight {
  ranges: Range[];
  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

function install() {
  const highlights = new Map<string, FakeHighlight>();
  vi.stubGlobal("CSS", { highlights });
  vi.stubGlobal("Highlight", FakeHighlight);
  return highlights;
}

const painted = (highlights: Map<string, FakeHighlight>) =>
  (highlights.get(HIGHLIGHT_NAME)?.ranges ?? []).map((r) => r.toString());

const actions: Array<{ destroy: () => void }> = [];

function mount(node: HTMLElement, params: Parameters<typeof highlightText>[1]) {
  const action = highlightText(node, params);
  actions.push(action);
  return action;
}

afterEach(() => {
  for (const action of actions.splice(0)) action.destroy();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("highlightText", () => {
  it("does nothing where the API is missing", () => {
    expect(supportsHighlightApi()).toBe(false);
    const node = document.createElement("div");
    node.textContent = "hello";
    const action = mount(node, { query: "hello" });
    action.update({ query: "h" });
    action.destroy();
  });

  it("paints a range per match without changing the DOM", () => {
    const highlights = install();
    const node = document.createElement("div");
    node.innerHTML =
      "<p>Café au lait</p><ul><li>cafe noir</li><li>tea</li></ul>";
    document.body.append(node);
    const before = node.innerHTML;

    mount(node, { query: "cafe" });

    expect(painted(highlights)).toEqual(["Café", "cafe"]);
    expect(node.innerHTML).toBe(before);
  });

  it("repaints on update and clears on destroy", () => {
    const highlights = install();
    const node = document.createElement("div");
    node.textContent = "alpha beta";
    document.body.append(node);

    const action = mount(node, { query: "alpha" });
    expect(painted(highlights)).toEqual(["alpha"]);

    action.update({ query: "beta", mode: "prefix" });
    expect(painted(highlights)).toEqual([]);

    action.update({ query: "beta" });
    expect(painted(highlights)).toEqual(["beta"]);

    action.destroy();
    expect(highlights.has(HIGHLIGHT_NAME)).toBe(false);
  });

  it("keeps the ranges of several containers apart", () => {
    const highlights = install();
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.textContent = "one two";
    b.textContent = "two three";
    document.body.append(a, b);

    const first = mount(a, { query: "two" });
    const second = mount(b, { query: "two" });
    expect(painted(highlights)).toEqual(["two", "two"]);

    first.destroy();
    expect(painted(highlights)).toEqual(["two"]);
    second.destroy();
  });

  it("repaints when the text changes", async () => {
    const highlights = install();
    const node = document.createElement("div");
    node.textContent = "nothing here";
    document.body.append(node);
    mount(node, { query: "needle" });
    expect(painted(highlights)).toEqual([]);

    node.textContent = "a needle appears";
    await Promise.resolve();

    expect(painted(highlights)).toEqual(["needle"]);
  });
});
