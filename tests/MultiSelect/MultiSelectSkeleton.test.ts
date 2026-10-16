import { render } from "@testing-library/svelte";
import MultiSelectSkeleton from "carbon-components-svelte/MultiSelect/MultiSelectSkeleton.svelte";

describe("MultiSelectSkeleton", () => {
  it.each(["xs", "sm", "lg", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(MultiSelectSkeleton, { props: { size } });
      expect(
        container.querySelector(".bx--multi-select.bx--skeleton"),
      ).toHaveClass(`bx--list-box--${size}`);
    },
  );

  it("draws a label bar above the field", () => {
    const { container } = render(MultiSelectSkeleton);
    const label = container.querySelector(".bx--label.bx--skeleton");
    expect(label?.nextElementSibling).toHaveClass(
      "bx--multi-select",
      "bx--skeleton",
    );
  });

  it("leaves the label bar out with hideLabel", () => {
    const { container } = render(MultiSelectSkeleton, {
      props: { hideLabel: true },
    });
    expect(container.querySelector(".bx--label")).toBeNull();
  });
});
