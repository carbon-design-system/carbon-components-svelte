import { render } from "@testing-library/svelte";
import DropdownSkeleton from "carbon-components-svelte/Dropdown/DropdownSkeleton.svelte";

describe("DropdownSkeleton", () => {
  it.each(["xs", "sm", "lg", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(DropdownSkeleton, { props: { size } });
      expect(
        container.querySelector(".bx--dropdown-v2.bx--skeleton"),
      ).toHaveClass(`bx--list-box--${size}`);
    },
  );

  it("draws a label bar above the field", () => {
    const { container } = render(DropdownSkeleton);
    const label = container.querySelector(".bx--label.bx--skeleton");
    expect(label?.nextElementSibling).toHaveClass(
      "bx--dropdown-v2",
      "bx--skeleton",
    );
  });

  it("leaves the label bar out with hideLabel", () => {
    const { container } = render(DropdownSkeleton, {
      props: { hideLabel: true },
    });
    expect(container.querySelector(".bx--label")).toBeNull();
  });
});
