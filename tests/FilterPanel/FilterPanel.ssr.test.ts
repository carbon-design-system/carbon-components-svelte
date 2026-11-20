// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import FilterPanelUrl from "./FilterPanelUrl.test.svelte";

describe("FilterPanel server render", () => {
  it("writes the filters from the URL: checked options, counts and chips", () => {
    const { document } = renderSSR(FilterPanelUrl, {
      search: "brand=Bolt&color=red&price=20..&brand=Nope&other=1",
    });

    expect(
      [
        ...document.querySelectorAll<HTMLInputElement>("input.bx--checkbox"),
      ].map((input) => [input.value, input.hasAttribute("checked")]),
    ).toEqual([
      ["Acme", false],
      ["Bolt", true],
    ]);
    expect(
      document
        .querySelector<HTMLInputElement>('input.bx--radio-button[value="red"]')
        ?.hasAttribute("checked"),
    ).toBe(true);
    // Brand: Bolt, Color: red, Price: from 20
    expect(
      [
        ...document.querySelectorAll(
          ".bx--filter-panel__chips .bx--tag__label",
        ),
      ].map((tag) => tag.textContent?.trim()),
    ).toEqual(["Brand: Bolt", "Color: red", "Price: from 20"]);
    expect(
      document.querySelector(".bx--filter-panel__results")?.textContent?.trim(),
    ).toBe("1 result");
  });

  it("writes the inline layout, an aside, because the width is not known", () => {
    const { document } = renderSSR(FilterPanelUrl, { search: "" });

    expect(document.querySelector("aside.bx--filter-flyout")).toHaveAttribute(
      "aria-label",
      "Filters",
    );
    expect(document.querySelector(".bx--side-panel")).toBeNull();
    expect(
      document.querySelector(".bx--filter-panel__applied--empty"),
    ).not.toBeNull();
  });
});
