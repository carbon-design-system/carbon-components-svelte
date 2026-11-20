// @vitest-environment node
import Cascader from "carbon-components-svelte/Cascader/Cascader.svelte";
import { renderSSR } from "../utils/ssr";
import { places } from "./nodes";

describe("Cascader server rendering", () => {
  it("writes the chosen path, the popup type and the form value", () => {
    const { document } = renderSSR(Cascader, {
      nodes: places,
      value: ["eu", "fr", "paris"],
      name: "city",
      labelText: "City",
    });

    const field = document.querySelector('[role="combobox"]');
    expect(field?.textContent).toContain("Europe / France / Paris");
    expect(field?.getAttribute("aria-haspopup")).toBe("tree");
    expect(field?.getAttribute("aria-expanded")).toBe("false");
    expect(
      document.querySelector<HTMLInputElement>('input[name="city"]')?.value,
    ).toBe('["eu","fr","paris"]');
  });

  it("writes the count and one entry per checked path", () => {
    const { document } = renderSSR(Cascader, {
      nodes: places,
      multiple: true,
      values: [["eu", "de", "berlin"], ["an"]],
      name: "places",
    });

    expect(document.querySelector('[role="combobox"]')?.textContent).toContain(
      "Europe / Germany / Berlin, Antarctica",
    );
    expect(
      [
        ...document.querySelectorAll<HTMLInputElement>('input[name="places"]'),
      ].map((input) => input.value),
    ).toEqual(['["eu","de","berlin"]', '["an"]']);
  });

  it("renders no menu, and starts no request, for a lazy tree", () => {
    let calls = 0;
    const { document } = renderSSR(Cascader, {
      nodes: [{ id: "a", text: "A", hasChildren: true }],
      loadChildren: () => {
        calls += 1;
        return [];
      },
    });

    expect(document.querySelector('[role="tree"]')).toBeNull();
    expect(calls).toBe(0);
  });

  it("writes the search input as a combobox with the chosen path", () => {
    const { document } = renderSSR(Cascader, {
      nodes: places,
      filterable: true,
      value: ["as", "jp", "tokyo"],
    });

    const input = document.querySelector<HTMLInputElement>(
      "input[role='combobox']",
    );
    expect(input?.getAttribute("value")).toBe("Asia / Japan / Tokyo");
  });
});
