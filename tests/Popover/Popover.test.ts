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

  it("should handle outside clicks", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Popover, {
      props: {
        open: true,
        closeOnOutsideClick: true,
      },
    });

    await user.click(document.body);
    expect(consoleLog).toHaveBeenCalledWith(
      "click:outside",
      expect.any(Object),
    );
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

  it("should render with caret", () => {
    render(Popover, {
      props: { open: true, caret: true },
    });

    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--caret",
    );
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
    const consoleLog = vi.spyOn(console, "log");
    render(Popover, {
      props: { open: true, closeOnOutsideClick: true },
    });

    await user.click(screen.getByTestId("content"));
    expect(consoleLog).not.toHaveBeenCalled();
  });
});
