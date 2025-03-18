import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Popover from "./Popover.test.svelte";

describe("Popover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when open", () => {
    render(Popover, { props: { open: true } });

    expect(screen.getByTestId("content")).toBeVisible();
    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--open",
    );
  });

  it("should not render when closed", () => {
    render(Popover, { props: { open: false } });

    const popover = screen.getByTestId("parent").firstElementChild;
    expect(popover).not.toHaveClass("bx--popover--open");
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

  it("should not close on outside click when closeOnOutsideClick is false", async () => {
    render(Popover, {
      props: {
        open: true,
        closeOnOutsideClick: false,
      },
    });

    const popover = screen.getByTestId("parent").firstElementChild;

    await user.click(document.body);
    expect(popover).toHaveClass("bx--popover--open");
  });

  test.each([
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

  it("should handle light variant", () => {
    render(Popover, {
      props: { open: true, light: true },
    });

    expect(screen.getByTestId("parent").firstElementChild).toHaveClass(
      "bx--popover--light",
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

  it("should not handle outside clicks when closed", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Popover, {
      props: { open: false, closeOnOutsideClick: true },
    });

    await user.click(document.body);
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should handle multiple variants simultaneously", () => {
    render(Popover, {
      props: {
        open: true,
        caret: true,
        light: true,
        align: "bottom-right",
      },
    });

    const popover = screen.getByTestId("parent").firstElementChild;
    expect(popover).toHaveClass("bx--popover--caret");
    expect(popover).toHaveClass("bx--popover--light");
    expect(popover).toHaveClass("bx--popover--bottom-right");
  });
});
