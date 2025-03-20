import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SkeletonPlaceholder from "./SkeletonPlaceholder.test.svelte";

describe("SkeletonPlaceholder", () => {
  it("should render with default props", () => {
    render(SkeletonPlaceholder);

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveClass("bx--skeleton__placeholder");
  });

  it("should render with custom size", () => {
    render(SkeletonPlaceholder, {
      props: { style: "height: 12rem; width: 12rem;" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveStyle({ height: "12rem", width: "12rem" });
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SkeletonPlaceholder);

    const element = screen.getByTestId("skeleton-placeholder");

    await user.click(element);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should accept additional attributes", () => {
    render(SkeletonPlaceholder, {
      props: {
        "data-testid": "custom-placeholder",
        "aria-label": "Loading placeholder",
      },
    });

    const element = screen.getByTestId("custom-placeholder");
    expect(element).toHaveAttribute("aria-label", "Loading placeholder");
  });

  it("should accept additional classes", () => {
    render(SkeletonPlaceholder, {
      props: { class: "custom-class" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveClass("bx--skeleton__placeholder", "custom-class");
  });
});
