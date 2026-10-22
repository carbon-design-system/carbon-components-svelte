import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SkeletonIcon from "./SkeletonIcon.test.svelte";

describe("SkeletonIcon", () => {
  it("should render with default props", () => {
    render(SkeletonIcon);

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveClass("bx--skeleton__placeholder");
    expect(element).toHaveStyle({ width: "16px", height: "16px" });
  });

  it("should render with a numeric size", () => {
    render(SkeletonIcon, {
      props: { size: 24 },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("should handle mouse events", async () => {
    const handlers = {
      onclick: vi.fn(),
      onmouseover: vi.fn(),
      onmouseenter: vi.fn(),
      onmouseleave: vi.fn(),
    };
    render(SkeletonIcon, { props: handlers });

    const element = screen.getByTestId("skeleton-icon");

    await user.click(element);
    expect(handlers.onclick).toHaveBeenCalled();

    await user.hover(element);
    expect(handlers.onmouseover).toHaveBeenCalled();
    expect(handlers.onmouseenter).toHaveBeenCalled();

    await user.unhover(element);
    expect(handlers.onmouseleave).toHaveBeenCalled();
  });
});
