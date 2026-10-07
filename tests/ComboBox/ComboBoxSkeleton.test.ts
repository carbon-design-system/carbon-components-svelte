import { render } from "@testing-library/svelte";
import ComboBoxSkeleton from "carbon-components-svelte/ComboBox/ComboBoxSkeleton.svelte";

describe("ComboBoxSkeleton", () => {
  it.each(["xs", "sm", "lg", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(ComboBoxSkeleton, { props: { size } });
      expect(
        container.querySelector(".bx--combo-box.bx--skeleton"),
      ).toHaveClass(`bx--list-box--${size}`);
    },
  );
});
