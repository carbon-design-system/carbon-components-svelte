// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PropertyInspector from "./PropertyInspector.test.svelte";

const shape = (id: string, x: number, name: string) => ({
  id,
  name,
  x,
  y: 5,
  fill: "#ff0000",
});

describe("PropertyInspector server render", () => {
  it("renders the groups, and Mixed where the objects differ, with no script", () => {
    const { document } = renderSSR(PropertyInspector, {
      selection: [shape("a", 10, "Card"), shape("b", 30, "Card")],
    });

    expect(document.querySelector("h3")?.textContent).toContain("Layout");
    const x = document.querySelector<HTMLInputElement>(
      'input[aria-label="Position X"]',
    );
    expect(x?.getAttribute("placeholder")).toBe("Mixed");
    expect(x?.getAttribute("aria-valuetext")).toBe("Mixed");
    const y = document.querySelector<HTMLInputElement>(
      'input[aria-label="Position Y"]',
    );
    expect(y?.getAttribute("aria-valuetext")).toBe("5");
    expect(
      document.querySelector("input.bx--text-input")?.getAttribute("value"),
    ).toBe("Card");
  });

  it("leaves a collapsed group's rows out", () => {
    const { document } = renderSSR(PropertyInspector, {
      selection: [shape("a", 10, "Card")],
    });
    expect(document.querySelector('[aria-label="On"]')).toBeNull();
    expect(
      document
        .querySelector('button[aria-controls$="group-b-rows"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
