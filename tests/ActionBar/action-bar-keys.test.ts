import {
  caretAtEdge,
  controlOwnsKey,
} from "carbon-components-svelte/ActionBar/action-bar-keys.js";

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  document.body.append(node);
  return node;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("controlOwnsKey", () => {
  it("gives a button every key", () => {
    const button = element("button");
    for (const key of [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ]) {
      expect(controlOwnsKey(button, key)).toBe(false);
    }
  });

  it("lets a text field keep the keys that move its caret", () => {
    const input = element("input", { type: "text" });
    expect(controlOwnsKey(input, "ArrowLeft")).toBe(true);
    expect(controlOwnsKey(input, "Home")).toBe(true);
    // Up and Down have nothing to move in one line.
    expect(controlOwnsKey(input, "ArrowDown")).toBe(false);
    expect(controlOwnsKey(element("textarea"), "ArrowDown")).toBe(true);
  });

  it("lets a select, a slider and a range keep every arrow", () => {
    expect(controlOwnsKey(element("select"), "ArrowRight")).toBe(true);
    expect(
      controlOwnsKey(element("div", { role: "slider" }), "ArrowLeft"),
    ).toBe(true);
    expect(
      controlOwnsKey(element("input", { type: "range" }), "ArrowDown"),
    ).toBe(true);
  });

  it("lets a combobox keep Up and Down, and every arrow while its popup is open", () => {
    const combobox = element("button", {
      role: "combobox",
      "aria-expanded": "false",
    });
    expect(controlOwnsKey(combobox, "ArrowDown")).toBe(true);
    expect(controlOwnsKey(combobox, "ArrowRight")).toBe(false);
    combobox.setAttribute("aria-expanded", "true");
    expect(controlOwnsKey(combobox, "ArrowRight")).toBe(true);
  });

  it("ignores keys that are not the toolbar's", () => {
    expect(controlOwnsKey(element("input", { type: "text" }), "a")).toBe(false);
    expect(controlOwnsKey(null, "ArrowLeft")).toBe(false);
  });
});

describe("caretAtEdge", () => {
  it("is true at the start for previous and at the end for next", () => {
    const input = element("input", { type: "text" });
    input.value = "abc";
    input.setSelectionRange(0, 0);
    expect(caretAtEdge(input, "previous")).toBe(true);
    expect(caretAtEdge(input, "next")).toBe(false);
    input.setSelectionRange(3, 3);
    expect(caretAtEdge(input, "next")).toBe(true);
    expect(caretAtEdge(input, "previous")).toBe(false);
  });

  it("is false while text is selected, in the middle, or for other controls", () => {
    const input = element("input", { type: "text" });
    input.value = "abc";
    input.setSelectionRange(0, 3);
    expect(caretAtEdge(input, "previous")).toBe(false);
    input.setSelectionRange(1, 1);
    expect(caretAtEdge(input, "previous")).toBe(false);
    expect(caretAtEdge(element("textarea"), "previous")).toBe(false);
    expect(caretAtEdge(element("input", { type: "number" }), "previous")).toBe(
      false,
    );
  });
});
