import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SkeletonText from "./SkeletonText.test.svelte";

describe("SkeletonText", () => {
  it("should render with default props", () => {
    render(SkeletonText);
    const element = screen.getByRole("paragraph");
    expect(element).toHaveClass("bx--skeleton__text");
    expect(element).toHaveStyle({ width: "100%" });
  });

  it("should render heading variant", () => {
    render(SkeletonText, { props: { heading: true } });
    const element = screen.getByRole("paragraph");
    expect(element).toHaveClass("bx--skeleton__text", "bx--skeleton__heading");
  });

  it("should render paragraph variant with default lines", () => {
    render(SkeletonText, { props: { paragraph: true } });

    const elements = screen.getAllByRole("paragraph");
    expect(elements).toHaveLength(3); // default lines is 3
    for (const element of elements) {
      expect(element).toHaveClass("bx--skeleton__text");
    }
  });

  it("should render paragraph with custom line count", () => {
    render(SkeletonText, { props: { paragraph: true, lines: 8 } });

    const elements = screen.getAllByRole("paragraph");
    expect(elements).toHaveLength(8);
  });

  it("should render with custom width", () => {
    render(SkeletonText, { props: { width: "50%" } });

    const element = screen.getByRole("paragraph");
    expect(element).toHaveStyle({ width: "50%" });
  });

  it("should render paragraph with pixel width", () => {
    render(SkeletonText, { props: { paragraph: true, width: "200px" } });

    const elements = screen.getAllByRole("paragraph");
    for (const element of elements) {
      const width = element.style.width;
      expect(width).toMatch(/^\d+px$/);
      const numWidth = Number.parseInt(width, 10);
      expect(numWidth).toBeGreaterThanOrEqual(125); // 200 - 75
      expect(numWidth).toBeLessThanOrEqual(200);
    }
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SkeletonText);

    const element = screen.getByRole("paragraph");

    await user.click(element);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should handle paragraph mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SkeletonText, { props: { paragraph: true } });

    const container = screen.getAllByRole("paragraph")[0].parentElement;
    assert(container);
    await user.click(container);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(container);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(container);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
