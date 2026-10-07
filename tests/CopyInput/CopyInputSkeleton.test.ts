import { render } from "@testing-library/svelte";
import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";

describe("CopyInputSkeleton", () => {
  it.each(["xs", "sm", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(CopyInputSkeleton, { props: { size } });
      expect(
        container.querySelector(".bx--skeleton.bx--text-input"),
      ).toHaveClass(`bx--text-input--${size}`);
    },
  );
});
