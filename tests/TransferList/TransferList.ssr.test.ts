// @vitest-environment node
import TransferList from "carbon-components-svelte/TransferList/TransferList.svelte";
import { renderSSR } from "../utils/ssr";

const items = Array.from({ length: 300 }, (_, i) => ({
  id: i,
  text: `Service ${i}`,
}));

describe("TransferList server render", () => {
  it("renders both lists, the selected one in order, with the form inputs", () => {
    const { document } = renderSSR(TransferList, {
      items,
      selectedIds: [7, 3],
      name: "services",
      legendText: "Services",
    });
    const options = (label: string) =>
      [
        ...document.querySelectorAll(
          `[role="listbox"][aria-labelledby$="${label}-title"] [role="option"]`,
        ),
      ].map((option) => option.textContent?.trim());

    expect(options("selected")).toEqual(["Service 7", "Service 3"]);
    expect(
      [...document.querySelectorAll('input[name="services"]')].map(
        (input) => (input as HTMLInputElement).value,
      ),
    ).toEqual(["7", "3"]);
  });

  it("renders only a window of a long list, not all of it", () => {
    const { document } = renderSSR(TransferList, { items, selectedIds: [] });
    const rendered = document.querySelectorAll('[role="option"]').length;

    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(40);
  });
});
