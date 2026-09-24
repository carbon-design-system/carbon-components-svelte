import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import SideNavResizeTest from "./SideNavResize.test.svelte";

const getHandle = () =>
  screen.getByRole("separator", { name: "Resize side navigation" });
const queryHandle = () =>
  screen.queryByRole("separator", { name: "Resize side navigation" });
const getNav = (container: HTMLElement) => {
  const nav = container.querySelector<HTMLElement>(".bx--side-nav");
  assert(nav);
  return nav;
};

describe("SideNav resize", () => {
  afterEach(() => {
    document.body.classList.remove("bx--side-nav-resizing");
  });

  it("renders the handle only when resizable and not rail", async () => {
    const { component } = render(SideNavResizeTest, {
      props: { resizable: false, rail: false },
    });
    expect(queryHandle()).not.toBeInTheDocument();

    component.resizable = true;
    component.rail = true;
    await tick();
    expect(queryHandle()).not.toBeInTheDocument();

    component.rail = false;
    await tick();
    expect(getHandle()).toBeInTheDocument();
  });

  it("defaults to Carbon's 256px width", () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: true },
    });
    expect(getHandle()).toHaveAttribute("aria-valuenow", "256");
    expect(
      getNav(container).style.getPropertyValue("--ccs-side-nav-width"),
    ).toBe("256px");
  });

  it("leaves a rail's width to CSS even when resizable", () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: true, rail: true, width: 320 },
    });
    const nav = getNav(container);
    expect(nav).not.toHaveClass("bx--side-nav--resizable");
    expect(nav.style.getPropertyValue("--ccs-side-nav-width")).toBe("");
    expect(nav.style.width).toBe("");
  });

  it("uses a custom handle label", () => {
    render(SideNavResizeTest, {
      props: { resizable: true, resizeHandleLabel: "Resize menu" },
    });
    expect(
      screen.getByRole("separator", { name: "Resize menu" }),
    ).toBeInTheDocument();
  });

  it("renders an out-of-range width clamped to the bounds", async () => {
    const { container, component } = render(SideNavResizeTest, {
      props: { resizable: true, width: 1000, minWidth: 200, maxWidth: 480 },
    });
    expect(getHandle()).toHaveAttribute("aria-valuenow", "480");
    expect(
      getNav(container).style.getPropertyValue("--ccs-side-nav-width"),
    ).toBe("480px");

    // Tightening the bounds re-clamps the rendered width.
    component.maxWidth = 400;
    await tick();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "400");
  });

  it("offsets Content by the resizable width", async () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: true, width: 320 },
    });
    const content = container.querySelector<HTMLElement>(".bx--content");
    assert(content);
    expect(content.style.getPropertyValue("--ccs-side-nav-width")).toBe(
      "320px",
    );

    const handle = getHandle();
    handle.focus();
    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(content.style.getPropertyValue("--ccs-side-nav-width")).toBe(
      "336px",
    );
  });

  it("does not offset Content when not resizable", () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: false, width: 320 },
    });
    const content = container.querySelector<HTMLElement>(".bx--content");
    assert(content);
    expect(content.style.getPropertyValue("--ccs-side-nav-width")).toBe("");
  });

  it("ArrowRight/ArrowLeft adjust width by a fixed step, clamped to bounds", async () => {
    render(SideNavResizeTest, {
      props: { resizable: true, width: 470, minWidth: 200, maxWidth: 480 },
    });

    const handle = getHandle();
    handle.focus();

    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "480");

    // Already at the max; another ArrowRight must not push past it.
    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "480");

    await fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "464");
  });

  it("clamps ArrowLeft at the minimum bound", async () => {
    render(SideNavResizeTest, {
      props: { resizable: true, width: 210, minWidth: 200, maxWidth: 480 },
    });

    const handle = getHandle();
    handle.focus();

    await fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "200");

    await fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "200");
  });

  it("Shift+Arrow uses a larger step", async () => {
    render(SideNavResizeTest, {
      props: { resizable: true, width: 300, minWidth: 200, maxWidth: 480 },
    });

    const handle = getHandle();
    await fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
    expect(handle).toHaveAttribute("aria-valuenow", "364");

    await fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true });
    expect(handle).toHaveAttribute("aria-valuenow", "300");
  });

  it("Home/End jump to the bounds", async () => {
    render(SideNavResizeTest, {
      props: { resizable: true, width: 300, minWidth: 200, maxWidth: 480 },
    });

    const handle = getHandle();
    await fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "480");

    await fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuenow", "200");
  });

  it("double-clicking the handle restores the initial width", async () => {
    render(SideNavResizeTest, { props: { resizable: true, width: 300 } });

    const handle = getHandle();
    await fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "480");

    await fireEvent.dblClick(handle);
    expect(handle).toHaveAttribute("aria-valuenow", "300");
    expect(screen.getByTestId("width")).toHaveTextContent("300");
  });

  it("a drag updates the bound width, clamped to bounds", async () => {
    render(SideNavResizeTest, {
      props: { resizable: true, width: 320, minWidth: 200, maxWidth: 480 },
    });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });

    await fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    expect(handle).toHaveAttribute("aria-valuenow", "420");
    expect(screen.getByTestId("width")).toHaveTextContent("420");

    // Drag past the max should clamp, not overshoot.
    await fireEvent.pointerMove(handle, { clientX: 900, pointerId: 1 });
    expect(handle).toHaveAttribute("aria-valuenow", "480");

    await fireEvent.pointerUp(handle, { pointerId: 1 });
  });

  it("rounds a fractional drag position to whole pixels", async () => {
    render(SideNavResizeTest, { props: { resizable: true, width: 256 } });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerMove(handle, { clientX: 282.918, pointerId: 1 });
    await fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(handle).toHaveAttribute("aria-valuenow", "239");
    expect(screen.getByTestId("width")).toHaveTextContent("239");
  });

  it("renders a fractional width prop rounded", () => {
    render(SideNavResizeTest, { props: { resizable: true, width: 300.6 } });
    expect(getHandle()).toHaveAttribute("aria-valuenow", "301");
  });

  it("marks the nav as resizing for the duration of a drag", async () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: true, width: 320, minWidth: 200, maxWidth: 480 },
    });

    const nav = getNav(container);
    const handle = getHandle();
    expect(nav).not.toHaveClass("bx--side-nav--resizing");

    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    expect(nav).toHaveClass("bx--side-nav--resizing");
    expect(document.body).toHaveClass("bx--side-nav-resizing");

    // A fast drag can move the pointer well past the handle's own bounds;
    // pointer capture keeps routing its events to the handle.
    await fireEvent.pointerMove(handle, { clientX: -1000, pointerId: 1 });
    expect(nav).toHaveClass("bx--side-nav--resizing");
    expect(handle).toHaveAttribute("aria-valuenow", "200");

    await fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(nav).not.toHaveClass("bx--side-nav--resizing");
    expect(document.body).not.toHaveClass("bx--side-nav-resizing");
  });

  it("ends the drag on an immediate pointerup", async () => {
    render(SideNavResizeTest, { props: { resizable: true, width: 320 } });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerUp(handle, { pointerId: 1 });
    await fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });

    expect(handle).toHaveAttribute("aria-valuenow", "320");
  });

  it.each(["pointerCancel", "lostPointerCapture"] as const)(
    "ends the drag on %s",
    async (eventName) => {
      render(SideNavResizeTest, { props: { resizable: true, width: 320 } });

      const handle = getHandle();
      await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
      await fireEvent[eventName](handle, { pointerId: 1 });
      await fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });

      expect(handle).toHaveAttribute("aria-valuenow", "320");
      expect(document.body).not.toHaveClass("bx--side-nav-resizing");
    },
  );

  it("ignores non-primary buttons", async () => {
    const { container } = render(SideNavResizeTest, {
      props: { resizable: true, width: 320 },
    });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, {
      clientX: 300,
      pointerId: 1,
      button: 2,
    });
    expect(getNav(container)).not.toHaveClass("bx--side-nav--resizing");

    await fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    expect(handle).toHaveAttribute("aria-valuenow", "320");
  });

  it("ignores moves from a different pointer", async () => {
    render(SideNavResizeTest, { props: { resizable: true, width: 320 } });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerMove(handle, { clientX: 400, pointerId: 2 });
    expect(handle).toHaveAttribute("aria-valuenow", "320");

    await fireEvent.pointerUp(handle, { pointerId: 1 });
  });

  it("fires resize once per drag, only when the width changed", async () => {
    const onResize = vi.fn();
    render(SideNavResizeTest, {
      props: { resizable: true, width: 320, onResize },
    });

    const handle = getHandle();
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerMove(handle, { clientX: 350, pointerId: 1 });
    await fireEvent.pointerMove(handle, { clientX: 380, pointerId: 1 });
    expect(onResize).not.toHaveBeenCalled();

    await fireEvent.pointerUp(handle, { pointerId: 1 });
    // Capture is released after `pointerup`; that must not fire it again.
    await fireEvent.lostPointerCapture(handle, { pointerId: 1 });
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith({ width: 400 });

    // A click without movement doesn't change the width.
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("fires resize for keyboard and double-click changes", async () => {
    const onResize = vi.fn();
    render(SideNavResizeTest, {
      props: { resizable: true, width: 470, maxWidth: 480, onResize },
    });

    const handle = getHandle();
    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onResize).toHaveBeenLastCalledWith({ width: 480 });

    // Already at the max: no change, no event.
    await fireEvent.keyDown(handle, { key: "End" });
    expect(onResize).toHaveBeenCalledTimes(1);

    await fireEvent.dblClick(handle);
    expect(onResize).toHaveBeenLastCalledWith({ width: 470 });
    expect(onResize).toHaveBeenCalledTimes(2);
  });

  it("cleans up the body class when unmounted mid-drag", async () => {
    const { unmount } = render(SideNavResizeTest, {
      props: { resizable: true },
    });

    await fireEvent.pointerDown(getHandle(), { clientX: 300, pointerId: 1 });
    expect(document.body).toHaveClass("bx--side-nav-resizing");

    unmount();
    expect(document.body).not.toHaveClass("bx--side-nav-resizing");
  });

  it("ends the drag when the handle is removed mid-drag", async () => {
    const { container, component } = render(SideNavResizeTest, {
      props: { resizable: true },
    });

    const nav = getNav(container);
    await fireEvent.pointerDown(getHandle(), { clientX: 300, pointerId: 1 });
    expect(nav).toHaveClass("bx--side-nav--resizing");

    component.rail = true;
    await tick();

    // Same nav element, so this is the prop change, not a remount.
    expect(getNav(container)).toBe(nav);
    expect(queryHandle()).not.toBeInTheDocument();
    expect(nav).not.toHaveClass("bx--side-nav--resizing");
    expect(document.body).not.toHaveClass("bx--side-nav-resizing");
  });
});
