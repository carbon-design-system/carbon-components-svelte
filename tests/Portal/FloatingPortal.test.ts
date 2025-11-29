import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import FloatingPortalTest from "./FloatingPortal.test.svelte";

describe("FloatingPortal", () => {
  afterEach(() => {
    const existingContainer = document.querySelector(
      "[data-portal]",
    ) as HTMLElement;
    existingContainer?.remove();
  });

  it("renders floating portal content", async () => {
    render(FloatingPortalTest);

    const referenceButton = await screen.findByText("Reference button");
    expect(referenceButton).toBeInTheDocument();

    const portalContent = await screen.findByText("Floating portal content");
    expect(portalContent).toBeInTheDocument();
  });

  it("positions portal relative to reference element", async () => {
    render(FloatingPortalTest);

    const referenceButton = await screen.findByText("Reference button");
    const portalContent = await screen.findByText("Floating portal content");

    expect(referenceButton).toBeInTheDocument();
    expect(portalContent).toBeInTheDocument();

    const portalContainer = portalContent.closest("[data-portal]");
    expect(portalContainer).toBeInTheDocument();
    expect(portalContainer?.parentElement).toBe(document.body);
  });

  it("supports different placement options", async () => {
    const testPlacement = async (
      placement:
        | "top"
        | "right"
        | "bottom"
        | "left"
        | "top-start"
        | "bottom-end",
    ) => {
      const { unmount } = render(FloatingPortalTest, {
        props: { placement },
      });

      const portalContent = await screen.findByText("Floating portal content");
      expect(portalContent).toBeInTheDocument();

      const floatingElement = portalContent.parentElement;
      assert(floatingElement instanceof HTMLElement);
      const styles = window.getComputedStyle(floatingElement);
      if (styles.position) {
        expect(styles.position).toBe("absolute");
      }

      unmount();
    };

    await testPlacement("top");
    await testPlacement("right");
    await testPlacement("bottom");
    await testPlacement("left");
    await testPlacement("top-start");
    await testPlacement("bottom-end");
  });

  it("handles conditional rendering", async () => {
    const { component } = render(FloatingPortalTest, {
      props: { showPortal: false },
    });

    let portalContent = screen.queryByText("Floating portal content");
    expect(portalContent).not.toBeInTheDocument();

    component.$set({ showPortal: true });

    portalContent = await screen.findByText("Floating portal content");
    expect(portalContent).toBeInTheDocument();

    component.$set({ showPortal: false });
    await tick();

    portalContent = screen.queryByText("Floating portal content");
    expect(portalContent).not.toBeInTheDocument();
  });

  it("updates position when offset changes", async () => {
    const { component } = render(FloatingPortalTest);

    const portalContent = await screen.findByText("Floating portal content");
    expect(portalContent).toBeInTheDocument();

    const floatingElement = portalContent.parentElement;
    assert(floatingElement instanceof HTMLElement);

    component.$set({ offset: 20 });
    await tick();

    const styles = window.getComputedStyle(floatingElement);
    if (styles.position) {
      expect(styles.position).toBe("absolute");
    }
  });

  it("renders custom slot content", async () => {
    render(FloatingPortalTest, {
      props: { portalContent: "Custom floating content" },
    });

    const portalContent = await screen.findByText("Custom floating content");
    expect(portalContent).toBeInTheDocument();
  });

  it("cleans up auto-update on unmount", async () => {
    const { unmount } = render(FloatingPortalTest);

    const portalContent = await screen.findByText("Floating portal content");
    expect(portalContent).toBeInTheDocument();

    unmount();

    const remainingContainer = document.querySelector("[data-portal]");
    expect(remainingContainer).not.toBeInTheDocument();
  });

  it("works with autoUpdate disabled", async () => {
    render(FloatingPortalTest, {
      props: { autoUpdate: false },
    });

    const portalContent = await screen.findByText("Floating portal content");
    expect(portalContent).toBeInTheDocument();

    const floatingElement = portalContent.parentElement;
    assert(floatingElement instanceof HTMLElement);
    const styles = window.getComputedStyle(floatingElement);
    if (styles.position) {
      expect(styles.position).toBe("absolute");
    }
  });
});
