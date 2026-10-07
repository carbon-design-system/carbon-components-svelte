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
});
