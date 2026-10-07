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
});
