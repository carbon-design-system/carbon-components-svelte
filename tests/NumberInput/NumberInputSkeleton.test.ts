import { render } from "@testing-library/svelte";
import NumberInputSkeleton from "carbon-components-svelte/NumberInput/NumberInputSkeleton.svelte";

describe("NumberInputSkeleton", () => {
  it("applies no size modifier by default (md)", () => {
    const { container } = render(NumberInputSkeleton);
    const field = container.querySelector(".bx--number.bx--skeleton");
    assert(field);
    expect(field.className).not.toMatch(/bx--number--(xs|sm|xl)/);
  });

  it.each(["xs", "sm", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(NumberInputSkeleton, { props: { size } });
      expect(container.querySelector(".bx--number.bx--skeleton")).toHaveClass(
        `bx--number--${size}`,
      );
    },
  );
});
