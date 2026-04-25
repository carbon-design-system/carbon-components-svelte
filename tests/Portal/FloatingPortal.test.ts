import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
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

  it("has data-floating-portal attribute", async () => {
    render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toHaveAttribute("data-floating-portal");
  });

  it("has data-floating-direction attribute", async () => {
    render(FloatingPortalTest, {
      props: { open: true, direction: "bottom" },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toHaveAttribute("data-floating-direction", "bottom");
  });

  it("uses top direction when direction prop is top", async () => {
    render(FloatingPortalTest, {
      props: { open: true, direction: "top" },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toHaveAttribute("data-floating-direction", "top");
  });

  it("uses left or right direction when direction prop is left", async () => {
    render(FloatingPortalTest, {
      props: { open: true, direction: "left" },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    const actualDirection = portalElement?.getAttribute(
      "data-floating-direction",
    );
    expect(["left", "right"]).toContain(actualDirection);
  });

  it("uses left or right direction when direction prop is right", async () => {
    render(FloatingPortalTest, {
      props: { open: true, direction: "right" },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    const actualDirection = portalElement?.getAttribute(
      "data-floating-direction",
    );
    expect(["left", "right"]).toContain(actualDirection);
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

  it("uses default z-index of 9200", async () => {
    render(FloatingPortalTest, {
      props: { open: true },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    const style = portalElement?.getAttribute("style") ?? "";
    expect(style).toContain("z-index: 9200");
  });

  it("accepts gapTop and gapBottom props", async () => {
    render(FloatingPortalTest, {
      props: { open: true, gapTop: 8, gapBottom: 10 },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toBeInTheDocument();
    const style = portalElement?.getAttribute("style") ?? "";
    expect(style).toContain("position: absolute");
  });

  it("accepts horizontal gap and vertical align offset props", async () => {
    render(FloatingPortalTest, {
      props: {
        open: true,
        direction: "right",
        horizontalGapLeft: 10,
        horizontalGapRight: 4,
        verticalAlignOffsetLeft: -10,
        verticalAlignOffsetRight: 10,
      },
    });

    const content = await screen.findByText("Floating content");
    const portalElement = content.closest("[data-floating-portal]");
    expect(portalElement).toBeInTheDocument();
    expect(["left", "right"]).toContain(
      portalElement?.getAttribute("data-floating-direction"),
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

    rerender({ open: false });
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

    rerender({ open: true });

    const content = await screen.findByText("Floating content");
    expect(content).toBeInTheDocument();

    rerender({ open: false });
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

      rerender({ open: false, scrollableContainer: true });
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

    it("disconnects MutationObserver when open becomes false", async () => {
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      const { rerender } = render(FloatingPortalTest, {
        props: { open: true },
      });

      await screen.findByText("Floating content");

      rerender({ open: false });
      await tick();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it("disconnects MutationObserver on unmount", async () => {
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      const { unmount } = render(FloatingPortalTest, {
        props: { open: true },
      });

      await screen.findByText("Floating content");

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
