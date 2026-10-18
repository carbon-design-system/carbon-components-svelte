import { render, screen } from "@testing-library/svelte";
import { type ComponentProps, tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { nextFrame } from "../utils/next-frame";
import { rect } from "../utils/rect";
import FloatingPortalTest from "./FloatingPortal.test.svelte";
import { countCalls, createTarget, renderOpen, stubLayout } from "./helpers";

describe("FloatingPortal", () => {
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
    const { content, portal } = await renderOpen();

    expect(content).toBeInTheDocument();
    expect(portal.parentElement).toBe(document.body);
  });

  it.each(["bottom", "top", "left", "right"] as const)(
    "sets data-floating-direction to the preferred %s side when it fits",
    async (direction) => {
      const { portal } = await renderOpen({ direction });

      expect(portal).toHaveAttribute("data-floating-direction", direction);
    },
  );

  describe("direction lock", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // Anchor now sits near the bottom of the viewport (insufficient room
    // below), as if the page scrolled. Without a lock this flips to "top".
    it.each([
      { name: "re-flips by default", props: {}, expected: "top" },
      {
        name: 'does not re-flip within the same open session when lockDirection is "always"',
        props: { lockDirection: "always" },
        expected: "bottom",
      },
    ] as const)(
      "$name on a scroll-driven reposition",
      async ({ props, expected }) => {
        const { portal } = await renderOpen({ direction: "bottom", ...props });
        expect(portal).toHaveAttribute("data-floating-direction", "bottom");

        vi.spyOn(
          screen.getByTestId("anchor"),
          "getBoundingClientRect",
        ).mockReturnValue(rect({ top: 750, bottom: 790, width: 100 }));
        vi.spyOn(portal, "getBoundingClientRect").mockReturnValue(
          rect({ top: 0, bottom: 200, width: 100 }),
        );

        window.dispatchEvent(new Event("scroll"));
        await nextFrame();

        expect(portal).toHaveAttribute("data-floating-direction", expected);
      },
    );
    describe("lockDirection with a layout that moves", () => {
      const nearBottom = rect({ top: 750, bottom: 790, width: 100 });
      const roomy = rect({ top: 300, bottom: 340, width: 100 });
      const floating = rect({ width: 100, height: 200 });
      const side = () =>
        document
          .querySelector("[data-floating-portal]")
          ?.getAttribute("data-floating-direction");

      // Opens with the anchor near the viewport bottom, so "bottom" flips to "top".
      async function openFlipped(
        props: Partial<ComponentProps<FloatingPortalTest>>,
      ) {
        const { rerender } = render(FloatingPortalTest, {
          props: { direction: "bottom", ...props },
        });
        const layout = stubLayout({ anchor: nearBottom, floating });
        await rerender({ open: true });
        await screen.findByText("Floating content");
        await nextFrame();
        expect(side()).toBe("top");
        return { rerender, layout };
      }

      it('keeps the flipped side when the preferred side fits again with lockDirection "after-flip"', async () => {
        const { layout } = await openFlipped({ lockDirection: "after-flip" });

        layout.anchor = roomy;
        window.dispatchEvent(new Event("scroll"));
        await nextFrame();

        expect(side()).toBe("top");
      });

      it.each(["after-flip", "always"] as const)(
        'recomputes the side on the next open with lockDirection "%s"',
        async (lockDirection) => {
          const { rerender, layout } = await openFlipped({ lockDirection });

          await rerender({ open: false });
          layout.anchor = roomy;
          await rerender({ open: true });
          await screen.findByText("Floating content");
          await nextFrame();

          expect(side()).toBe("bottom");
        },
      );
    });
  });

  it("applies z-index from zIndex prop", async () => {
    const { portal } = await renderOpen({ zIndex: 10000 });

    expectInlineStyle(portal, { zIndex: "10000" });
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
        const { portal } = await renderOpen(props);

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
        vi.spyOn(portal, "getBoundingClientRect").mockReturnValue(
          rect({ width: 60, height: 30 }),
        );

        window.dispatchEvent(new Event("scroll"));
        await nextFrame();

        expectInlineStyle(portal, { top, left });
        expect(portal).toHaveAttribute(
          "data-floating-direction",
          props.direction,
        );
      },
    );
  });

  describe("caret nudge and layout passes", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each(["start", "end"] as const)(
      "emits the anchor half-width as --ccs-tooltip-caret-nudge for intrinsicAlign %s",
      async (intrinsicAlign) => {
        const { rerender } = render(FloatingPortalTest, {
          props: { intrinsicWidth: true, intrinsicAlign },
        });
        stubLayout({
          anchor: rect({ top: 100, left: 300, width: 80, height: 40 }),
          floating: rect({ width: 60, height: 30 }),
        });
        await rerender({ open: true });
        await screen.findByText("Floating content");
        await nextFrame();

        expectInlineStyle(document.querySelector("[data-floating-portal]"), {
          "--ccs-tooltip-caret-nudge": "40px",
        });
      },
    );

    it("measures the floating box again after layout and flips a side placement that no longer fits", async () => {
      const { rerender } = render(FloatingPortalTest, {
        props: { direction: "right" },
      });
      const layout = stubLayout({
        anchor: rect({ top: 100, left: 900, width: 100, height: 40 }),
        floating: rect({ height: 30 }),
      });
      // The floating box has no width until the frame after it is first read.
      let laidOut: boolean | undefined;
      Object.defineProperty(layout, "floating", {
        get: () => {
          if (laidOut === undefined) {
            laidOut = false;
            requestAnimationFrame(() => {
              laidOut = true;
            });
          }
          return rect({ width: laidOut ? 200 : 0, height: 30 });
        },
      });
      await rerender({ open: true });
      const content = await screen.findByText("Floating content");
      const portal = content.closest("[data-floating-portal]");

      await vi.waitFor(() =>
        expect(portal).toHaveAttribute("data-floating-direction", "left"),
      );
    });
  });

  it("applies position styles", async () => {
    const { portal } = await renderOpen();

    expectInlineStyle(portal, { position: "absolute" });
    const style = portal.getAttribute("style") ?? "";
    expect(style).toMatch(/top:\s*\d+px/);
    expect(style).toMatch(/left:\s*\d+px/);
    expect(style).toMatch(/width:\s*\d+px/);
  });

  it.each([
    {
      name: "a non-body explicit target",
      setup: () => {
        const target = createTarget();
        return { props: { target }, getParent: () => target };
      },
    },
    {
      name: "the anchor's nearest <dialog> ancestor",
      setup: () => ({
        props: { dialogAncestor: true },
        getParent: () => screen.getByTestId("dialog-ancestor"),
      }),
    },
    {
      name: "the anchor's nearest [popover] ancestor",
      setup: () => ({
        props: { popoverAncestor: true },
        getParent: () => screen.getByTestId("popover-ancestor"),
      }),
    },
  ])("mounts into $name with position: fixed", async ({ setup }) => {
    const { props, getParent } = setup();
    const { portal } = await renderOpen(props);

    expect(portal.parentElement).toBe(getParent());
    expectInlineStyle(portal, { position: "fixed" });
  });

  it("stays position: absolute when the explicit target is document.body", async () => {
    const { portal } = await renderOpen({ target: document.body });

    expectInlineStyle(portal, { position: "absolute" });
  });

  it("explicit target overrides the auto-detected <dialog> ancestor", async () => {
    const customTarget = createTarget();
    const { portal } = await renderOpen({
      dialogAncestor: true,
      target: customTarget,
    });

    expect(portal.parentElement).toBe(customTarget);
  });

  describe("intrinsicWidth", () => {
    it("applies width and no translateX when intrinsicWidth is false (default)", async () => {
      const { portal } = await renderOpen({ intrinsicWidth: false });

      const style = portal.getAttribute("style") ?? "";
      expect(style).toMatch(/width:\s*\d+px/);
      expect(style).not.toContain("translateX(-50%)");
    });

    it.each([
      { align: "center", transform: "translateX(-50%)" },
      { align: "end", transform: "translateX(-100%)" },
      { align: "start", transform: "" },
    ] as const)(
      "applies no width and transform '$transform' for intrinsicAlign $align",
      async ({ align, transform }) => {
        const { portal } = await renderOpen({
          intrinsicWidth: true,
          intrinsicAlign: align,
        });

        expectInlineStyle(portal, { transform, width: "" });
      },
    );
  });

  it("binds ref to the floating portal element", async () => {
    const { component, portal } = await renderOpen();

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portal);
    expect(component.ref).toHaveAttribute("data-floating-portal");
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
    expect(
      document.querySelector("[data-floating-portal]"),
    ).not.toBeInTheDocument();
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

      const { unmount } = await renderOpen();

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

      expect(countCalls(addSpy, "scroll")).toBe(1);
      expect(countCalls(addSpy, "resize")).toBe(1);
    });

    it("does not hold a window scroll/resize listener while closed", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      render(FloatingPortalTest, { props: { open: false } });
      await tick();

      expect(countCalls(addSpy, "scroll")).toBe(0);
      expect(countCalls(addSpy, "resize")).toBe(0);
    });

    it.each(["scroll", "resize"])(
      "ignores window %s once the portal closes",
      async (type) => {
        const rafSpy = vi.spyOn(window, "requestAnimationFrame");
        const { rerender } = await renderOpen();
        await rerender({ open: false });
        const rafCountBefore = rafSpy.mock.calls.length;

        window.dispatchEvent(new Event(type));

        expect(rafSpy.mock.calls.length).toBe(rafCountBefore);
      },
    );

    it("removes the pooled window listener once the last open instance unmounts", async () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = await renderOpen();

      unmount();

      expect(countCalls(removeSpy, "scroll")).toBe(1);
      expect(countCalls(removeSpy, "resize")).toBe(1);
    });
  });

  describe("scrollable ancestor tracking", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("listens for scroll events on scrollable ancestors", async () => {
      const addEventSpy = vi.spyOn(HTMLElement.prototype, "addEventListener");

      await renderOpen({ scrollableContainer: true });

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

      const { rerender } = await renderOpen({ scrollableContainer: true });

      await rerender({ open: false, scrollableContainer: true });
      await tick();

      expect(countCalls(removeEventSpy, "scroll")).toBeGreaterThan(0);
    });

    it("removes scroll listeners on unmount", async () => {
      const removeEventSpy = vi.spyOn(
        HTMLElement.prototype,
        "removeEventListener",
      );

      const { unmount } = await renderOpen({ scrollableContainer: true });

      unmount();

      expect(countCalls(removeEventSpy, "scroll")).toBeGreaterThan(0);
    });

    it("schedules position update when a scrollable ancestor scrolls", async () => {
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");

      await renderOpen({ scrollableContainer: true });

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

      await renderOpen();

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

        const { rerender, unmount } = await renderOpen();
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
