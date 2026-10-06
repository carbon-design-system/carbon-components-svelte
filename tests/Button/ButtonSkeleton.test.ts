import { render, screen } from "@testing-library/svelte";
import ButtonSkeleton from "./ButtonSkeleton.test.svelte";

describe("ButtonSkeleton", () => {
  it("keeps an href skeleton out of the tab order and accessibility tree", () => {
    render(ButtonSkeleton);

    const skeleton = screen.getByTestId("skeleton-href");
    expect(skeleton.tagName).toBe("A");
    expect(skeleton).toHaveAttribute("href", "/docs");
    expect(skeleton).toHaveAttribute("tabindex", "-1");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a plain placeholder without href", () => {
    render(ButtonSkeleton);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.tagName).toBe("DIV");
    expect(skeleton).toHaveClass("bx--skeleton", "bx--btn");
  });
});
