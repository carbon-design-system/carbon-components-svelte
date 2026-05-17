import { render } from "@testing-library/svelte";
import ToolbarSearchNumericValue from "./ToolbarSearchNumericValue.test.svelte";

describe("ToolbarSearch numeric value", () => {
  it("does not crash when value is a number and expands when non-zero", () => {
    const { container } = render(ToolbarSearchNumericValue, {
      props: { value: 123 },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(wrapper).not.toBeNull();
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });

  it("treats numeric 0 as a value and expands (no longer swallowed)", () => {
    const { container } = render(ToolbarSearchNumericValue, {
      props: { value: 0 },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });

  it("does not expand when value is the empty string", () => {
    const { container } = render(ToolbarSearchNumericValue, {
      props: { value: "" },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(false);
  });
});
