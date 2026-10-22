import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SkeletonText from "./SkeletonText.test.svelte";

describe("SkeletonText", () => {
  it("should render with default props", () => {
    render(SkeletonText);
    const element = screen.getByRole("paragraph", { hidden: true });
    expect(element).toHaveClass("bx--skeleton__text");
    expect(element).toHaveStyle({ width: "100%" });
  });

  it("should render heading variant", () => {
    render(SkeletonText, { props: { heading: true } });
    const element = screen.getByRole("paragraph", { hidden: true });
    expect(element).toHaveClass("bx--skeleton__text", "bx--skeleton__heading");
  });

  it.each([
    ["default", {}, 3],
    ["custom", { lines: 8 }, 8],
  ])("should render paragraph with %s line count", (_, props, count) => {
    render(SkeletonText, { props: { paragraph: true, ...props } });

    const elements = screen.getAllByRole("paragraph", { hidden: true });
    expect(elements).toHaveLength(count);
    for (const element of elements) {
      expect(element).toHaveClass("bx--skeleton__text");
    }
  });

  it("should render with custom width", () => {
    render(SkeletonText, { props: { width: "50%" } });

    const element = screen.getByRole("paragraph", { hidden: true });
    expect(element).toHaveStyle({ width: "50%" });
  });

  it("should render paragraph with pixel width", () => {
    render(SkeletonText, { props: { paragraph: true, width: "200px" } });

    const elements = screen.getAllByRole("paragraph", { hidden: true });
    for (const element of elements) {
      const width = element.style.width;
      expect(width).toMatch(/^\d+px$/);
      const numWidth = Number.parseInt(width, 10);
      expect(numWidth).toBeGreaterThanOrEqual(125); // 200 - 75
      expect(numWidth).toBeLessThanOrEqual(200);
    }
  });

  it("should not render a negative paragraph line width for narrow pixel widths", () => {
    render(SkeletonText, { props: { paragraph: true, width: "50px" } });

    for (const element of screen.getAllByRole("paragraph", { hidden: true })) {
      expect(element.style.width).toMatch(/^\d+px$/);
    }
  });

  it("should subtract a random pixel offset from percentage paragraph widths", () => {
    render(SkeletonText, { props: { paragraph: true, width: "50%" } });

    for (const element of screen.getAllByRole("paragraph", { hidden: true })) {
      expect(element.style.width).toMatch(/^calc\(50% - \d+px\)$/);
    }
  });

  it("should remove the bottom margin of a single line with `noMargin`", () => {
    render(SkeletonText, { props: { noMargin: true } });

    expect(screen.getByRole("paragraph", { hidden: true })).toHaveClass(
      "bx--skeleton__text--no-margin",
    );
  });

  it("should remove the bottom margin of only the last paragraph line with `noMargin`", () => {
    render(SkeletonText, { props: { paragraph: true, noMargin: true } });

    const elements = screen.getAllByRole("paragraph", { hidden: true });
    expect(
      elements.map((el) =>
        el.classList.contains("bx--skeleton__text--no-margin"),
      ),
    ).toEqual([false, false, true]);
  });

  it("should hide text lines from assistive technology", () => {
    render(SkeletonText);

    const element = screen.getByRole("paragraph", { hidden: true });
    expect(element).toHaveAttribute("aria-hidden", "true");
  });

  it("should hide the paragraph variant container from assistive technology", () => {
    render(SkeletonText, { props: { paragraph: true } });

    const container = screen.getAllByRole("paragraph", { hidden: true })[0]
      .parentElement;
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("should handle mouse events", async () => {
    const handlers = {
      onclick: vi.fn(),
      onmouseover: vi.fn(),
      onmouseenter: vi.fn(),
      onmouseleave: vi.fn(),
    };
    render(SkeletonText, { props: handlers });

    const element = screen.getByRole("paragraph", { hidden: true });

    await user.click(element);
    expect(handlers.onclick).toHaveBeenCalled();

    await user.hover(element);
    expect(handlers.onmouseover).toHaveBeenCalled();
    expect(handlers.onmouseenter).toHaveBeenCalled();

    await user.unhover(element);
    expect(handlers.onmouseleave).toHaveBeenCalled();
  });

  it("should handle paragraph mouse events", async () => {
    const handlers = {
      onclick: vi.fn(),
      onmouseover: vi.fn(),
      onmouseenter: vi.fn(),
      onmouseleave: vi.fn(),
    };
    render(SkeletonText, { props: { ...handlers, paragraph: true } });

    const container = screen.getAllByRole("paragraph", { hidden: true })[0]
      .parentElement;
    assert(container);

    await user.click(container);
    expect(handlers.onclick).toHaveBeenCalled();

    await user.hover(container);
    expect(handlers.onmouseover).toHaveBeenCalled();
    expect(handlers.onmouseenter).toHaveBeenCalled();

    await user.unhover(container);
    expect(handlers.onmouseleave).toHaveBeenCalled();
  });
});
