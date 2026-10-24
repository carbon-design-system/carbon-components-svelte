import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Popover from "./Popover.test.svelte";

describe("Popover", () => {
  it("should render when open", () => {
    render(Popover, { props: { open: true } });

    expect(screen.getByTestId("content")).toBeVisible();
    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--open",
    );
  });

  it("dispatches click:outside with the target even when closeOnOutsideClick is false", async () => {
    const onClickOutside = vi.fn();
    render(Popover, {
      props: { open: true, closeOnOutsideClick: false, onClickOutside },
    });

    await user.click(document.body);
    expect(onClickOutside).toHaveBeenCalledTimes(1);
    expect(onClickOutside.mock.calls[0][0].detail).toEqual({
      target: document.body,
    });
  });

  it.each([
    "top",
    "top-left",
    "top-right",
    "bottom",
    "bottom-left",
    "bottom-right",
    "left",
    "left-bottom",
    "left-top",
    "right",
    "right-bottom",
    "right-top",
  ] as const)("should handle %s alignment", (align) => {
    render(Popover, {
      props: { open: true, align },
    });

    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      `bx--popover--${align}`,
    );
  });

  it.each([
    ["top-start", "top-left"],
    ["top-end", "top-right"],
    ["bottom-start", "bottom-left"],
    ["bottom-end", "bottom-right"],
    ["left-start", "left-top"],
    ["left-end", "left-bottom"],
    ["right-start", "right-top"],
    ["right-end", "right-bottom"],
  ] as const)("places the v11 %s alignment as %s", (align, placement) => {
    render(Popover, {
      props: { open: true, align },
    });

    const popover = screen.getByTestId("parent").firstElementChild;
    assert(popover);
    expect(popover).toHaveClass(`bx--popover--${placement}`);
    expect(
      [...popover.classList].filter((name) =>
        /^bx--popover--(top|bottom|left|right)/.test(name),
      ),
    ).toEqual([`bx--popover--${placement}`]);
  });

  describe("in RTL", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("style");
    });

    it.each([
      ["top-start", "top-right"],
      ["top-end", "top-left"],
      ["bottom-start", "bottom-right"],
      ["bottom-end", "bottom-left"],
      ["left-start", "left-top"],
      ["right-end", "right-bottom"],
      ["top-left", "top-left"],
      ["bottom-right", "bottom-right"],
    ] as const)("places %s as %s", (align, placement) => {
      document.documentElement.style.direction = "rtl";
      render(Popover, { props: { open: true, align } });

      expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
        `bx--popover--${placement}`,
      );
    });
  });

  it("should render with caret", () => {
    render(Popover, {
      props: { open: true, caret: true },
    });

    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--caret",
    );
  });

  it("draws the drop shadow by default and drops it when dropShadow is false", async () => {
    const { rerender } = render(Popover, { props: { open: true } });
    const popover = screen.getByTestId("parent").firstElementChild;

    expect(popover).toHaveClass("bx--popover--drop-shadow");

    await rerender({ dropShadow: false });
    expect(popover).not.toHaveClass("bx--popover--drop-shadow");
  });

  it("draws a border only when border is true", async () => {
    const { rerender } = render(Popover, { props: { open: true } });
    const popover = screen.getByTestId("parent").firstElementChild;

    expect(popover).not.toHaveClass("bx--popover--border");

    await rerender({ border: true });
    expect(popover).toHaveClass("bx--popover--border");
  });

  it("should handle high contrast variant", () => {
    render(Popover, {
      props: { open: true, highContrast: true },
    });

    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--high-contrast",
    );
  });

  it("should handle relative positioning", () => {
    render(Popover, {
      props: { open: true, relative: true },
    });

    const popover = screen.getByTestId("parent").firstElementChild;
    expect(popover).toHaveClass("bx--popover--relative");
    expect(popover).toHaveStyle({ position: "relative" });
  });

  it("should not dispatch click:outside event when clicking inside", async () => {
    const onClickOutside = vi.fn();
    render(Popover, {
      props: { open: true, closeOnOutsideClick: true, onClickOutside },
    });

    await user.click(screen.getByTestId("content"));
    expect(onClickOutside).not.toHaveBeenCalled();
  });
});
