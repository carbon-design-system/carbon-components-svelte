import { render } from "@testing-library/svelte";
import SelectSkeleton from "carbon-components-svelte/Select/SelectSkeleton.svelte";

describe("SelectSkeleton", () => {
  it.each(["xs", "sm", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(SelectSkeleton, { props: { size } });
      expect(container.querySelector(".bx--select.bx--skeleton")).toHaveClass(
        `bx--select--${size}`,
      );
    },
  );
});
