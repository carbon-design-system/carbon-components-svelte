import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SkeletonPlaceholder from "./SkeletonPlaceholder.test.svelte";

describe("SkeletonPlaceholder", () => {
  it("should render with default props", () => {
    render(SkeletonPlaceholder);

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveClass("bx--skeleton__placeholder");
  });

  it("should render with size prop (string)", () => {
    render(SkeletonPlaceholder, {
      props: { size: "12rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveStyle({ height: "12rem", width: "12rem" });
  });

  it("should render with size prop (number)", () => {
    render(SkeletonPlaceholder, {
      props: { size: 200 },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveStyle({ height: "200px", width: "200px" });
  });

  it("should render with width and height props", () => {
    render(SkeletonPlaceholder, {
      props: { width: "20rem", height: "10rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveStyle({ width: "20rem", height: "10rem" });
  });

  it("should allow width/height to override size", () => {
    render(SkeletonPlaceholder, {
      props: { size: "5rem", width: "10rem", height: "8rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveStyle({ width: "10rem", height: "8rem" });
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
