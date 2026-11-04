// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PickerGrid from "./PickerGrid.test.svelte";

describe("PickerGrid server render", () => {
  it("writes the first window of options, grouped, with no browser", () => {
    const { document } = renderSSR(PickerGrid, { recent: ["carrot"] });
    const listbox = document.querySelector("[role=listbox]");
    expect(listbox).not.toBeNull();
    expect(
      [...document.querySelectorAll("[role=group]")].map((group) =>
        group.getAttribute("aria-label"),
      ),
    ).toEqual(["Recent", "Fruit", "Vegetables"]);
    expect(
      [...document.querySelectorAll("[role=option]")].map((option) =>
        option.getAttribute("aria-label"),
      ),
    ).toEqual(["Carrot", "Apple", "Banana", "Carrot", "Leek"]);
  });

  it("uses the columns it was given, since the server cannot measure", () => {
    const { document } = renderSSR(PickerGrid);
    const root = document.querySelector(".bx--picker-grid");
    expect(root?.getAttribute("style")).toContain(
      "--ccs-picker-grid-columns: 2",
    );
  });
});
