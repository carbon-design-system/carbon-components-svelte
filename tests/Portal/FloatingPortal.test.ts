import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { nextFrame } from "../utils/next-frame";
import { rect } from "../utils/rect";
import FloatingPortalTest from "./FloatingPortal.test.svelte";

describe("FloatingPortal", () => {
  afterEach(() => {
    const existingPortals = document.querySelectorAll("[data-floating-portal]");
    for (const portal of existingPortals) {
      portal.remove();
    }
  });

  it("does not render when open is false", () => {
    render(FloatingPortalTest, {
      props: { open: false },
    });

    const content = screen.queryByText("Floating content");
    expect(content).not.toBeInTheDocument();

    const portalElement = document.querySelector("[data-floating-portal]");
    expect(portalElement).not.toBeInTheDocument();
  });

  it("renders floating content when open is true", async () => {
    render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    expect(content).toBeInTheDocument();

    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toBeInTheDocument();
    expect(portalElement?.parentElement).toBe(document.body);
  });

  it("renders slot content correctly", async () => {
    render(FloatingPortalTest, {
      props: { open: true, content: "Custom floating content" },
    });

    const content = await screen.findByText("Custom floating content");
    expect(content).toBeInTheDocument();
  });

  it.each(["bottom", "top", "left", "right"] as const)(
    "sets data-floating-direction to the preferred %s side when it fits",
    async (direction) => {
      render(FloatingPortalTest, {
        props: { open: true, direction },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      expect(portalElement).toHaveAttribute(
        "data-floating-direction",
        direction,
      );
    },
  );

  describe("direction lock", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("re-flips on a scroll-driven reposition by default", async () => {
      render(FloatingPortalTest, {
        props: { open: true, direction: "bottom" },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      assert(portalElement instanceof HTMLElement);
      const anchor = screen.getByTestId("anchor");
      expect(portalElement).toHaveAttribute(
        "data-floating-direction",
        "bottom",
      );

      vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(
        rect({ top: 750, bottom: 790, width: 100 }),
      );
      vi.spyOn(portalElement, "getBoundingClientRect").mockReturnValue(
        rect({ top: 0, bottom: 200, width: 100 }),
      );

      window.dispatchEvent(new Event("scroll"));
      await nextFrame();

      expect(portalElement).toHaveAttribute("data-floating-direction", "top");
    });

    it('does not re-flip on a scroll-driven reposition within the same open session when lockDirection is "always"', async () => {
      render(FloatingPortalTest, {
        props: { open: true, direction: "bottom", lockDirection: "always" },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      assert(portalElement instanceof HTMLElement);
      const anchor = screen.getByTestId("anchor");
      expect(portalElement).toHaveAttribute(
        "data-floating-direction",
        "bottom",
      );

      // Anchor now sits near the bottom of the viewport (insufficient room
      // below), as if the page scrolled. Without the lock this flips to "top".
      vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(
        rect({ top: 750, bottom: 790, width: 100 }),
      );
      vi.spyOn(portalElement, "getBoundingClientRect").mockReturnValue(
        rect({ top: 0, bottom: 200, width: 100 }),
      );

      window.dispatchEvent(new Event("scroll"));
      await nextFrame();

      expect(portalElement).toHaveAttribute(
        "data-floating-direction",
        "bottom",
      );
    });
  });

  it("applies z-index from zIndex prop", async () => {
    render(FloatingPortalTest, {
      props: { open: true, zIndex: 10000 },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    const style = portalElement?.getAttribute("style") ?? "";
    expect(style).toContain("z-index: 10000");
  });

  describe("gap and offset props", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // Anchor: 100x40 at (300, 100). Floating box: 60x30. The viewport is large
    // enough that no case flips.
    it.each([
      {
        name: "gapBottom",
        props: { direction: "bottom", gapBottom: 10 },
        top: "150px",
        left: "300px",
      },
      {
        name: "gapTop",
        props: { direction: "top", gapTop: 8 },
        top: "62px",
        left: "300px",
      },
      {
        name: "horizontalGapRight",
        props: { direction: "right", horizontalGapRight: 4 },
        top: "105px",
        left: "404px",
      },
      {
        name: "horizontalGapLeft",
        props: { direction: "left", horizontalGapLeft: 10 },
        top: "105px",
        left: "230px",
      },
      {
        name: "verticalAlignOffsetRight",
        props: { direction: "right", verticalAlignOffsetRight: 10 },
        top: "115px",
        left: "400px",
      },
      {
        name: "verticalAlignOffsetLeft",
        props: { direction: "left", verticalAlignOffsetLeft: -10 },
        top: "95px",
        left: "240px",
      },
    ] as const)(
      "applies $name to the position",
      async ({ props, top, left }) => {
        render(FloatingPortalTest, {
          props: { open: true, ...props },
        });

        const content = await screen.findByText("Floating content");
        const portalElement = content.closest("[data-floating-portal]");
        assert(portalElement instanceof HTMLElement);

        vi.spyOn(
          screen.getByTestId("anchor"),
          "getBoundingClientRect",
        ).mockReturnValue(
          rect({
            top: 100,
            left: 300,
            width: 100,
            height: 40,
            bottom: 140,
            right: 400,
          }),
        );
        vi.spyOn(portalElement, "getBoundingClientRect").mockReturnValue(
          rect({ width: 60, height: 30 }),
        );

        window.dispatchEvent(new Event("scroll"));
        await nextFrame();

        expectInlineStyle(portalElement, { top, left });
        expect(portalElement).toHaveAttribute(
          "data-floating-direction",
          props.direction,
        );
      },
    );
  });

  it("applies position styles", async () => {
    render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    const style = portalElement?.getAttribute("style") ?? "";
    expect(style).toContain("position: absolute");
    expect(style).toMatch(/top:\s*\d+px/);
    expect(style).toMatch(/left:\s*\d+px/);
    expect(style).toMatch(/width:\s*\d+px/);
  });

  it("uses position: fixed when mounted into a non-body target", async () => {
    const customTarget = document.createElement("div");
    document.body.appendChild(customTarget);

    render(FloatingPortalTest, {
      props: { open: true, target: customTarget },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(portalElement.parentElement).toBe(customTarget);
    const style = portalElement.getAttribute("style") ?? "";
    expect(style).toContain("position: fixed");
    expect(style).not.toContain("position: absolute");

    customTarget.remove();
  });

  it("auto-mounts into the anchor's nearest <dialog> ancestor", async () => {
    render(FloatingPortalTest, {
      props: { open: true, dialogAncestor: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    assert(portalElement instanceof HTMLElement);

    const dialog = screen.getByTestId("dialog-ancestor");
    expect(portalElement.parentElement).toBe(dialog);
    expect(portalElement.getAttribute("style") ?? "").toContain(
      "position: fixed",
    );
  });

  it("explicit target overrides the auto-detected <dialog> ancestor", async () => {
    const customTarget = document.createElement("div");
    document.body.appendChild(customTarget);

    render(FloatingPortalTest, {
      props: { open: true, dialogAncestor: true, target: customTarget },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(portalElement.parentElement).toBe(customTarget);

    customTarget.remove();
  });

  it("auto-mounts into the anchor's nearest [popover] ancestor", async () => {
    render(FloatingPortalTest, {
      props: { open: true, popoverAncestor: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    assert(portalElement instanceof HTMLElement);

    const popover = screen.getByTestId("popover-ancestor");
    expect(portalElement.parentElement).toBe(popover);
    expect(portalElement.getAttribute("style") ?? "").toContain(
      "position: fixed",
    );
  });

  describe("intrinsicWidth", () => {
    it("applies width and no translateX when intrinsicWidth is false (default)", async () => {
      render(FloatingPortalTest, {
        props: { open: true, intrinsicWidth: false },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      const style = portalElement?.getAttribute("style") ?? "";
      expect(style).toMatch(/width:\s*\d+px/);
      expect(style).not.toContain("translateX(-50%)");
    });

    it("applies translateX(-50%) and no width when intrinsicWidth is true", async () => {
      render(FloatingPortalTest, {
        props: { open: true, intrinsicWidth: true },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      const style = portalElement?.getAttribute("style") ?? "";
      expect(style).toContain("transform: translateX(-50%)");
      expect(style).not.toMatch(/\bwidth:\s*\d+px/);
    });

    it("applies no horizontal transform for intrinsicAlign start", async () => {
      render(FloatingPortalTest, {
        props: {
          open: true,
          intrinsicWidth: true,
          intrinsicAlign: "start",
        },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      const style = portalElement?.getAttribute("style") ?? "";
      expect(style).not.toContain("translateX");
      expect(style).not.toMatch(/\bwidth:\s*\d+px/);
    });

    it("applies translateX(-100%) for intrinsicAlign end", async () => {
      render(FloatingPortalTest, {
        props: {
          open: true,
          intrinsicWidth: true,
          intrinsicAlign: "end",
        },
      });

      const content = await screen.findByText("Floating content");
      const portalElement = content.closest("[data-floating-portal]");
      const style = portalElement?.getAttribute("style") ?? "";
      expect(style).toContain("transform: translateX(-100%)");
      expect(style).not.toMatch(/\bwidth:\s*\d+px/);
    });
  });

  it("binds ref to the floating portal element", async () => {
    const { component } = render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portalElement);
    expect(component.ref).toHaveAttribute("data-floating-portal");
  });

  it("ref is null when portal is not open", () => {
    const { component } = render(FloatingPortalTest, {
      props: { open: false },
    });

    expect(component.ref).toBeNull();
  });

  it("removes portal when open becomes false", async () => {
    const { rerender } = render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    expect(content).toBeInTheDocument();

    await rerender({ open: false });
    await tick();

    const remainingContent = screen.queryByText("Floating content");
    expect(remainingContent).not.toBeInTheDocument();

    const portalElement = document.querySelector("[data-floating-portal]");
    expect(portalElement).not.toBeInTheDocument();
  });

  it("handles conditional rendering", async () => {
    const { rerender } = render(FloatingPortalTest, {
      props: { open: false },
    });

    expect(screen.queryByText("Floating content")).not.toBeInTheDocument();

    await rerender({ open: true });

    const content = await screen.findByText("Floating content");
    expect(content).toBeInTheDocument();

    await rerender({ open: false });
    await tick();

    expect(screen.queryByText("Floating content")).not.toBeInTheDocument();
  });

  it("unmounts cleanly", async () => {
    const { unmount } = render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    expect(content).toBeInTheDocument();

    unmount();

    const remainingPortal = document.querySelector("[data-floating-portal]");
    expect(remainingPortal).not.toBeInTheDocument();
  });

  describe("cleanup on unmount", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("cancels pending requestAnimationFrame on unmount", async () => {
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

      const { unmount } = render(FloatingPortalTest, {
        props: { open: true },
      });

      await screen.findByText("Floating content");

      window.dispatchEvent(new Event("scroll"));
      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe("window listener pooling", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("shares one window scroll/resize listener across multiple open instances", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      render(FloatingPortalTest, { props: { open: true } });
      await screen.findByText("Floating content");
      render(FloatingPortalTest, { props: { open: true } });
      await screen.findAllByText("Floating content");

      const scrollAdds = addSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      ).length;
      const resizeAdds = addSpy.mock.calls.filter(
        ([event]) => event === "resize",
      ).length;
      expect(scrollAdds).toBe(1);
      expect(resizeAdds).toBe(1);
    });

    it("does not hold a window scroll/resize listener while closed", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      render(FloatingPortalTest, { props: { open: false } });
      await tick();

      const scrollAdds = addSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      ).length;
      const resizeAdds = addSpy.mock.calls.filter(
        ([event]) => event === "resize",
      ).length;
      expect(scrollAdds).toBe(0);
      expect(resizeAdds).toBe(0);
    });

    it("removes the pooled window listener once the last open instance unmounts", async () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(FloatingPortalTest, {
        props: { open: true },
      });
      await screen.findByText("Floating content");

      unmount();

      const scrollRemoves = removeSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      ).length;
      const resizeRemoves = removeSpy.mock.calls.filter(
        ([event]) => event === "resize",
      ).length;
      expect(scrollRemoves).toBe(1);
      expect(resizeRemoves).toBe(1);
    });
  });

  describe("scrollable ancestor tracking", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("listens for scroll events on scrollable ancestors", async () => {
      const addEventSpy = vi.spyOn(HTMLElement.prototype, "addEventListener");

      render(FloatingPortalTest, {
        props: { open: true, scrollableContainer: true },
      });

      await screen.findByText("Floating content");

      const scrollCalls = addEventSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      );
      expect(scrollCalls.length).toBeGreaterThan(0);

      const hasContainerListener = scrollCalls.some(
        (call) =>
          call[2] && typeof call[2] === "object" && call[2].passive === true,
      );
      expect(hasContainerListener).toBe(true);
    });

    it("removes scroll listeners when open becomes false", async () => {
      const removeEventSpy = vi.spyOn(
        HTMLElement.prototype,
        "removeEventListener",
      );

      const { rerender } = render(FloatingPortalTest, {
        props: { open: true, scrollableContainer: true },
      });

      await screen.findByText("Floating content");

      await rerender({ open: false, scrollableContainer: true });
      await tick();

      const scrollRemoveCalls = removeEventSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      );
      expect(scrollRemoveCalls.length).toBeGreaterThan(0);
    });

    it("removes scroll listeners on unmount", async () => {
      const removeEventSpy = vi.spyOn(
        HTMLElement.prototype,
        "removeEventListener",
      );

      const { unmount } = render(FloatingPortalTest, {
        props: { open: true, scrollableContainer: true },
      });

      await screen.findByText("Floating content");

      unmount();

      const scrollRemoveCalls = removeEventSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      );
      expect(scrollRemoveCalls.length).toBeGreaterThan(0);
    });

    it("schedules position update when a scrollable ancestor scrolls", async () => {
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");

      render(FloatingPortalTest, {
        props: { open: true, scrollableContainer: true },
      });

      await screen.findByText("Floating content");

      const rafCountBefore = rafSpy.mock.calls.length;

      const container = screen.getByTestId("scroll-container");
      container.dispatchEvent(new Event("scroll"));

      expect(rafSpy.mock.calls.length).toBeGreaterThan(rafCountBefore);
    });
  });

  describe("anchor position tracking", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("schedules position update when anchor style changes", async () => {
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");

      render(FloatingPortalTest, {
        props: { open: true },
      });

      await screen.findByText("Floating content");

      const anchor = screen.getByTestId("anchor");
      const rafCountBefore = rafSpy.mock.calls.length;

      anchor.setAttribute(
        "style",
        "position: absolute; left: 100px; top: 50px;",
      );
      await tick();

      expect(rafSpy.mock.calls.length).toBeGreaterThan(rafCountBefore);
    });

    it.each(["close", "unmount"] as const)(
      "ignores anchor mutations after %s",
      async (how) => {
        const rafSpy = vi.spyOn(window, "requestAnimationFrame");

        const { rerender, unmount } = render(FloatingPortalTest, {
          props: { open: true },
        });

        await screen.findByText("Floating content");
        const anchor = screen.getByTestId("anchor");

        if (how === "close") {
          await rerender({ open: false });
        } else {
          unmount();
        }

        const rafCountBefore = rafSpy.mock.calls.length;

        anchor.setAttribute("style", "position: absolute; left: 100px;");
        await tick();

        expect(rafSpy.mock.calls.length).toBe(rafCountBefore);
      },
    );
  });

  describe("floating content resize tracking", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("shares one ResizeObserver across open portals", async () => {
      let created = 0;
      const Base = globalThis.ResizeObserver;
      vi.stubGlobal(
        "ResizeObserver",
        class extends Base {
          constructor(callback: ResizeObserverCallback) {
            super(callback);
            created++;
          }
        },
      );

      for (let i = 0; i < 3; i++) {
        render(FloatingPortalTest, { props: { open: true } });
      }
      await tick();
      await tick();

      expect(document.querySelectorAll("[data-floating-portal]")).toHaveLength(
        3,
      );
      expect(created).toBe(1);
    });

    it("repositions when the observer reports the floating content resized and stops on close", async () => {
      let deliver: ResizeObserverCallback = () => {};
      const observed = new Set<Element>();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: ResizeObserverCallback) {
            deliver = callback;
          }
          observe(element: Element) {
            observed.add(element);
          }
          unobserve(element: Element) {
            observed.delete(element);
          }
          disconnect() {}
        },
      );
      const getBoundingClientRect = vi.spyOn(
        Element.prototype,
        "getBoundingClientRect",
      );

      const { rerender } = render(FloatingPortalTest, {
        props: { open: true },
      });
      const floating = await screen.findByText("Floating content");
      await tick();
      await tick();
      expect(observed.has(floating)).toBe(true);

      const readsOfFloating = () =>
        getBoundingClientRect.mock.contexts.filter((el) => el === floating)
          .length;
      const before = readsOfFloating();

      deliver(
        [{ target: floating }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
      expect(readsOfFloating()).toBeGreaterThan(before);

      await rerender({ open: false });
      await tick();
      expect(observed.size).toBe(0);
    });
  });
});
