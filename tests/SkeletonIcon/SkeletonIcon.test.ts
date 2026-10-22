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
    const consoleLog = vi.spyOn(console, "log");
    render(SkeletonIcon);

    const element = screen.getByTestId("skeleton-icon");

    await user.click(element);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
