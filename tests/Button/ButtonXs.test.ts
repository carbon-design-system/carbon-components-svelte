import { render, screen } from "@testing-library/svelte";
import Button from "carbon-components-svelte/Button/Button.svelte";
import ButtonSkeleton from "carbon-components-svelte/Button/ButtonSkeleton.svelte";

describe("Button xs size", () => {
  it("applies the xs modifier", () => {
    render(Button, { props: { size: "xs", iconDescription: "Add" } });

    expect(screen.getByRole("button")).toHaveClass("bx--btn--xs");
    expect(screen.getByRole("button")).not.toHaveClass("bx--btn--sm");
  });

  it("applies the xs modifier to the skeleton", () => {
    const { container } = render(ButtonSkeleton, { props: { size: "xs" } });

    expect(container.querySelector(".bx--skeleton")).toHaveClass("bx--btn--xs");
  });
});
