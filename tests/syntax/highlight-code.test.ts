import { highlightCode } from "../../src/syntax/highlight-code.js";

// The test DOM has no Highlight API: a registry is a Map of name to a Set of
// ranges, which is all `highlightCode` uses.
class FakeHighlight extends Set<Range> {}

const registry = () =>
  (globalThis.CSS as unknown as { highlights: Map<string, FakeHighlight> })
    .highlights;

/** `name: text` for every registered range, in registration order. */
const painted = () =>
  [...registry()].flatMap(([name, ranges]) =>
    [...ranges].map((range) => `${name}: ${range.toString()}`),
  );

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
  it("registers one range per token under syntax-<type>", () => {
    const pre = mount("<pre><code>const a = 1;</code></pre>");
    highlightCode(pre, "js");
    expect(painted()).toEqual([
      "syntax-definition-keyword: const",
      "syntax-definition: a",
      "syntax-operator: =",
      "syntax-number: 1",
      "syntax-punctuation: ;",
    ]);
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
    const action = highlightCode(code, { language: "js", code: "let a" });
    code.textContent = "true";
    action.update({ language: "js", code: "true" });
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
    first.destroy();
    expect(painted()).toEqual(["syntax-number: 2"]);
  });

  it("leaves the code plain without the Highlight API or a known language", () => {
    const code = mount("<code>let a</code>");
    highlightCode(code, "cobol");
    expect(registry().size).toBe(0);
    vi.stubGlobal("CSS", {});
    expect(() => highlightCode(code, "js").destroy()).not.toThrow();
  });
});
