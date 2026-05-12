import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SkeletonIcon from "./SkeletonIcon.test.svelte";

describe("SkeletonIcon", () => {
  it("should render with default props", () => {
    render(SkeletonIcon);

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveClass("bx--skeleton__placeholder");
    expect(element).toHaveStyle({ width: "16px", height: "16px" });
  });

  it("should render with size 20", () => {
    render(SkeletonIcon, {
      props: { size: 20 },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveStyle({ width: "20px", height: "20px" });
  });

  it("should render with size 24", () => {
    render(SkeletonIcon, {
      props: { size: 24 },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("should render with size 32", () => {
    render(SkeletonIcon, {
      props: { size: 32 },
    });

    const element = screen.getByTestId("skeleton-icon");
    expect(element).toHaveStyle({ width: "32px", height: "32px" });
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
