// @vitest-environment node
import TreeSelect from "carbon-components-svelte/TreeSelect/TreeSelect.svelte";
import { renderSSR } from "../utils/ssr";
import { tree } from "./nodes";

describe("TreeSelect server rendering", () => {
  it("writes the selected label, the popup type and the form value", () => {
    const { document } = renderSSR(TreeSelect, {
      nodes: tree,
      selectedId: "paris",
      name: "city",
      labelText: "City",
    });

    const field = document.querySelector('[role="combobox"]');
    expect(field?.textContent).toContain("Paris");
    expect(field?.getAttribute("aria-haspopup")).toBe("tree");
    expect(field?.getAttribute("aria-expanded")).toBe("false");
    expect(
      document.querySelector<HTMLInputElement>('input[name="city"]')?.value,
    ).toBe("paris");
  });

  it("writes a checkbox field's count and one entry per reported node", () => {
    const { document } = renderSSR(TreeSelect, {
      nodes: tree,
      selectionMode: "checkbox",
      checkedIds: ["eu"],
      name: "places",
    });

    expect(document.querySelector('[role="combobox"]')?.textContent).toContain(
      "Europe",
    );
    expect(
      [
        ...document.querySelectorAll<HTMLInputElement>('input[name="places"]'),
      ].map((input) => input.value),
    ).toEqual(["eu"]);
  });

  it("writes the open tree with string aria values", () => {
    const { document } = renderSSR(TreeSelect, {
      nodes: tree,
      open: true,
      expandedIds: ["eu"],
    });

    expect(document.querySelector('[role="tree"]')).not.toBeNull();
    const europe = document.querySelector('[role="treeitem"]');
    expect(europe?.getAttribute("aria-expanded")).toBe("true");
    expect(europe?.getAttribute("aria-level")).toBe("1");
    expect(
      document.querySelectorAll('[role="treeitem"][aria-level="2"]'),
    ).toHaveLength(2);
  });
});
