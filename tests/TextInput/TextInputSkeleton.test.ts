import { render } from "@testing-library/svelte";
import PasswordInputSkeleton from "carbon-components-svelte/TextInput/PasswordInputSkeleton.svelte";
import TextInputSkeleton from "carbon-components-svelte/TextInput/TextInputSkeleton.svelte";

describe.each([
  ["TextInputSkeleton", TextInputSkeleton],
  ["PasswordInputSkeleton", PasswordInputSkeleton],
])("%s", (_, Skeleton) => {
  it("applies no size modifier by default (md)", () => {
    const { container } = render(Skeleton);
    const field = container.querySelector(".bx--skeleton.bx--text-input");
    assert(field);
    expect(field.className).not.toMatch(/bx--text-input--(xs|sm|xl)/);
  });

  it.each(["xs", "sm", "xl"] as const)(
    "applies the %s size modifier",
    (size) => {
      const { container } = render(Skeleton, { props: { size } });
      expect(
        container.querySelector(".bx--skeleton.bx--text-input"),
      ).toHaveClass(`bx--text-input--${size}`);
    },
  );
});
