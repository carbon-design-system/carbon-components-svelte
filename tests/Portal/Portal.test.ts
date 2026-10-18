import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { createTarget, renderPortal } from "./helpers";
import PortalFocusTest from "./Portal.focus.test.svelte";
import PortalTest from "./Portal.test.svelte";

describe("Portal", () => {
  it("each portal instance is independent", async () => {
    const { unmount: unmount1, portal: portalElement1 } = await renderPortal({
      portalContent: "Portal 1",
    });
    const { unmount: unmount2, portal: portalElement2 } = await renderPortal({
      portalContent: "Portal 2",
    });

    expect(portalElement1).not.toBe(portalElement2);

    unmount1();

    const remainingPortals = document.querySelectorAll("[data-portal]");
    expect(remainingPortals).toHaveLength(1);
    expect(await screen.findByText("Portal 2")).toBeInTheDocument();

    unmount2();

    const finalPortals = document.querySelectorAll("[data-portal]");
    expect(finalPortals).toHaveLength(0);
  });

  it("handles conditional rendering", async () => {
    const { rerender } = render(PortalTest, {
      props: { showPortal: false },
    });

    let portalContent = screen.queryByText("Portal content");
    expect(portalContent).not.toBeInTheDocument();

    let portalElement = document.querySelector("[data-portal]");
    expect(portalElement).not.toBeInTheDocument();

    await rerender({ showPortal: true });

    portalContent = await screen.findByText("Portal content");
    expect(portalContent).toBeInTheDocument();

    portalElement = portalContent.closest("[data-portal]");
    expect(portalElement).toBeInTheDocument();

    await rerender({ showPortal: false });
    await tick();

    portalContent = screen.queryByText("Portal content");
    expect(portalContent).not.toBeInTheDocument();

    portalElement = document.querySelector("[data-portal]");
    expect(portalElement).not.toBeInTheDocument();
  });

  it("uses custom tag when tag prop is specified", async () => {
    const { portal } = await renderPortal({ tag: "section" });

    expect(portal.tagName).toBe("SECTION");
  });

  // The content renders after mount, so the server markup and the first
  // client render are both empty. It must still land in the target by the
  // next tick, which consumers such as `Menu` wait on before focusing.
  it("mounts the content into the target by the first tick", async () => {
    const { component } = render(PortalTest);
    await tick();

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref?.tagName).toBe("DIV");
    expect(component.ref?.parentElement).toBe(document.body);
    expect(component.ref).toHaveTextContent("Portal content");
  });

  it("binds ref to the portal element", async () => {
    const { component, portal } = await renderPortal();

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portal);
    expect(component.ref).toHaveAttribute("data-portal");
  });

  it("ref updates when portal is conditionally shown", async () => {
    const { component, rerender } = render(PortalTest, {
      props: { showPortal: false },
    });

    expect(component.ref).toBeNull();

    await rerender({ showPortal: true });

    const portalElement = (await screen.findByText("Portal content")).closest(
      "[data-portal]",
    );

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portalElement);

    await rerender({ showPortal: false });
    await tick();

    expect(component.ref).toBeNull();
  });

  it("forwards rest props to the portal element", async () => {
    const { portal: portalElement } = await renderPortal({
      class: "custom-portal-class",
      id: "test-portal-id",
      "data-testid": "portal-test",
      "aria-label": "Test portal",
      style: "background-color: red;",
    });

    expect(portalElement).toHaveClass("custom-portal-class");
    expect(portalElement).toHaveAttribute("id", "test-portal-id");
    expect(portalElement).toHaveAttribute("data-testid", "portal-test");
    expect(portalElement).toHaveAttribute("aria-label", "Test portal");
    expect(portalElement.getAttribute("style")).toContain("background-color");
  });

  describe("custom target", () => {
    it("mounts into the provided target element", async () => {
      const customTarget = createTarget();

      const { portal } = await renderPortal({ target: customTarget });

      expect(portal.parentElement).toBe(customTarget);
      expect(portal.parentElement).not.toBe(document.body);
    });

    it("moves the portal when target changes", async () => {
      const firstTarget = createTarget();
      const secondTarget = createTarget();

      const { rerender, portal } = await renderPortal({ target: firstTarget });

      expect(portal.parentElement).toBe(firstTarget);

      await rerender({ target: secondTarget });
      await tick();

      expect(portal.parentElement).toBe(secondTarget);
    });
  });

  describe("focus preservation when moving to body", () => {
    it("preserves focus on element inside portal when it is moved to document.body", async () => {
      render(PortalFocusTest);

      const input = await screen.findByTestId("portal-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });
  });
});
