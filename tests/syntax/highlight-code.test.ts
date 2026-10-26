import { highlightCode } from "../../src/syntax/highlight-code.js";
import { flushMacrotask } from "../utils/flush-macrotask";

// The test DOM has no Highlight API: a registry is a Map of name to a Set of
// ranges, which is all `highlightCode` uses.
class FakeHighlight extends Set<StaticRange> {}

const registry = () =>
  (globalThis.CSS as unknown as { highlights: Map<string, FakeHighlight> })
    .highlights;

/** The text a static range covers. */
const text = (range: StaticRange) => {
  const live = document.createRange();
  live.setStart(range.startContainer, range.startOffset);
  live.setEnd(range.endContainer, range.endOffset);
  return live.toString();
};

/** `name: text` for every registered range, in registration order. */
const painted = () =>
  [...registry()].flatMap(([name, ranges]) =>
    [...ranges].map((range) => `${name}: ${text(range)}`),
  );

const ranges = () => [...registry().values()].flatMap((set) => [...set]);

beforeEach(() => {
  vi.stubGlobal("CSS", { highlights: new Map() });
  vi.stubGlobal("Highlight", FakeHighlight);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
};

describe("highlightCode", () => {
  it("registers one static range per token under syntax-<type>", () => {
    const pre = mount("<pre><code>const a = 1;</code></pre>");
    highlightCode(pre, "js");
    expect(painted()).toEqual([
      "syntax-definition-keyword: const",
      "syntax-definition: a",
      "syntax-operator: =",
      "syntax-number: 1",
      "syntax-punctuation: ;",
    ]);
    for (const range of ranges()) expect(range).toBeInstanceOf(StaticRange);
    expect(pre.innerHTML).toBe("<code>const a = 1;</code>");
  });

  it("maps tokens that cross text node boundaries", () => {
    const code = mount("<code>con<b>st</b> a</code>");
    highlightCode(code, "js");
    expect(painted()).toEqual([
      "syntax-definition-keyword: const",
      "syntax-definition: a",
    ]);
  });

  it("replaces its ranges on update and removes them on destroy", () => {
    const code = mount("<code>let a</code>");
    const action = highlightCode(code, { language: "js" });
    code.textContent = "true";
    action.update({ language: "js" });
    expect(painted()).toEqual(["syntax-bool: true"]);
    action.destroy();
    expect(registry().size).toBe(0);
  });

  it("keeps other elements' ranges in a shared highlight", () => {
    const first = highlightCode(mount("<code>1</code>"), "js");
    const second = document.createElement("code");
    second.textContent = "2";
    document.body.append(second);
    highlightCode(second, "js");
    first.update("js");
    expect(painted()).toEqual(["syntax-number: 2", "syntax-number: 1"]);
    first.destroy();
    expect(painted()).toEqual(["syntax-number: 2"]);
  });

  it("re-highlights when the text changes outside the action", async () => {
    const code = mount("<code>let a</code>");
    highlightCode(code, "js");
    assert(code.firstChild instanceof Text);
    code.firstChild.data = "1";
    await flushMacrotask();
    expect(painted()).toEqual(["syntax-number: 1"]);
    code.append("+2");
    await flushMacrotask();
    expect(painted()).toEqual([
      "syntax-number: 1",
      "syntax-number: 2",
      "syntax-operator: +",
    ]);
  });

  it("re-highlights a replaced <code>, and not for changes beside it", async () => {
    const div = mount("<div><code>1</code><button>Show more</button></div>");
    highlightCode(div, "js");
    const [before] = ranges();
    div.querySelector("button")?.replaceChildren("Show less");
    await flushMacrotask();
    expect(ranges()).toEqual([before]);
    div
      .querySelector("code")
      ?.replaceWith(
        Object.assign(document.createElement("code"), { textContent: "true" }),
      );
    await flushMacrotask();
    expect(painted()).toEqual(["syntax-bool: true"]);
  });

  it("stops watching the text on destroy", async () => {
    const code = mount("<code>1</code>");
    highlightCode(code, "js").destroy();
    code.textContent = "2";
    await flushMacrotask();
    expect(registry().size).toBe(0);
  });

  it("leaves the code plain without the Highlight API or a known language", () => {
    const code = mount("<code>let a</code>");
    highlightCode(code, "cobol");
    expect(registry().size).toBe(0);
    vi.stubGlobal("CSS", {});
    expect(() => highlightCode(code, "js")).not.toThrow();
  });

  it("removes its ranges when updated to an unknown language", () => {
    const code = mount("<code>let a</code>");
    const action = highlightCode(code, "js");
    action.update("cobol");
    expect(registry().size).toBe(0);
  });
});
