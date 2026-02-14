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
});
