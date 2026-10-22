import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import SkeletonPlaceholder from "./SkeletonPlaceholder.test.svelte";

describe("SkeletonPlaceholder", () => {
  it("should render with size prop (string)", () => {
    render(SkeletonPlaceholder, {
      props: { size: "12rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expectInlineStyle(element, { height: "12rem", width: "12rem" });
  });

  it("should render with width and height props", () => {
    render(SkeletonPlaceholder, {
      props: { width: "20rem", height: "10rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expectInlineStyle(element, { width: "20rem", height: "10rem" });
  });

  it("should allow width/height to override size", () => {
    render(SkeletonPlaceholder, {
      props: { size: "5rem", width: "10rem", height: "8rem" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expectInlineStyle(element, { width: "10rem", height: "8rem" });
  });

  it("should hide the placeholder from assistive technology", () => {
    render(SkeletonPlaceholder);

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveAttribute("aria-hidden", "true");
  });

  it("should handle mouse events", async () => {
    const handlers = {
      onclick: vi.fn(),
      onmouseover: vi.fn(),
      onmouseenter: vi.fn(),
      onmouseleave: vi.fn(),
    };
    render(SkeletonPlaceholder, { props: handlers });

    const element = screen.getByTestId("skeleton-placeholder");

    await user.click(element);
    expect(handlers.onclick).toHaveBeenCalled();

    await user.hover(element);
    expect(handlers.onmouseover).toHaveBeenCalled();
    expect(handlers.onmouseenter).toHaveBeenCalled();

    await user.unhover(element);
    expect(handlers.onmouseleave).toHaveBeenCalled();
  });

  it("should accept additional classes", () => {
    render(SkeletonPlaceholder, {
      props: { class: "custom-class" },
    });

    const element = screen.getByTestId("skeleton-placeholder");
    expect(element).toHaveClass("bx--skeleton__placeholder", "custom-class");
  });
});
