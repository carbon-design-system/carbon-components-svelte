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

  it.each([20, 24, 32])("should render with size %i", (size) => {
    render(SkeletonIcon, {
      props: { size },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveStyle({ width: `${size}px`, height: `${size}px` });
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

  it("should accept additional attributes", () => {
    render(SkeletonIcon, {
      props: {
        "data-testid": "custom-icon",
        "aria-label": "Loading icon",
      },
    });

    const element = screen.getByTestId("custom-icon");
    expect(element).toHaveAttribute("aria-label", "Loading icon");
  });

  it("should accept additional classes", () => {
    render(SkeletonIcon, {
      props: { class: "custom-class" },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveClass("bx--skeleton__placeholder", "custom-class");
  });
});
