import { render, screen } from "@testing-library/svelte";
import FilterIconTags from "./Tag.filterIcon.test.svelte";

describe("Tag filter with an icon", () => {
  it("renders the icon prop and the icon slot before the label", () => {
    render(FilterIconTags);

    for (const text of ["Icon prop", "Icon slot"]) {
      const tag = screen.getByText(text).closest(".bx--tag");
      assert(tag);
      const icon = tag.querySelector(".bx--tag__custom-icon");
      expect(icon, text).toBeInTheDocument();
      expect(icon?.nextElementSibling, text).toHaveClass("bx--tag__label");
      expect(tag, text).toHaveClass("bx--tag--with-icon");
    }
  });

  it("leaves a filter tag without an icon unchanged", () => {
    render(FilterIconTags);

    const tag = screen.getByText("Plain").closest(".bx--tag");
    assert(tag);
    expect(tag.querySelector(".bx--tag__custom-icon")).not.toBeInTheDocument();
    expect(tag).not.toHaveClass("bx--tag--with-icon");
  });
});
