import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import PortalFocusTest from "./Portal.focus.test.svelte";
import PortalTest from "./Portal.test.svelte";

describe("Portal", () => {
  afterEach(() => {
    const existingPortals = document.querySelectorAll("[data-portal]");
    for (const portal of existingPortals) {
      portal.remove();
    }
  });

  it("each portal instance is independent", async () => {
    const { unmount: unmount1 } = render(PortalTest, {
      props: { portalContent: "Portal 1" },
    });

    const portalContent1 = await screen.findByText("Portal 1");
    const portalElement1 = portalContent1.closest("[data-portal]");
    assert(portalElement1 instanceof HTMLElement);

    const { unmount: unmount2 } = render(PortalTest, {
      props: { portalContent: "Portal 2" },
    });

    const portalContent2 = await screen.findByText("Portal 2");
    const portalElement2 = portalContent2.closest("[data-portal]");
    assert(portalElement2 instanceof HTMLElement);

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
    render(PortalTest, {
      props: { tag: "section" },
    });

    const portalContent = await screen.findByText("Portal content");
    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(portalElement.tagName).toBe("SECTION");
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
    const { component } = render(PortalTest);

    const portalContent = await screen.findByText("Portal content");
    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portalElement);
    expect(component.ref).toHaveAttribute("data-portal");
  });

  it("ref updates when portal is conditionally shown", async () => {
    const { component, rerender } = render(PortalTest, {
      props: { showPortal: false },
    });

    expect(component.ref).toBeNull();

    await rerender({ showPortal: true });

    const portalContent = await screen.findByText("Portal content");
    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(component.ref).toBeInstanceOf(HTMLElement);
    expect(component.ref).toBe(portalElement);

    await rerender({ showPortal: false });
    await tick();

    expect(component.ref).toBeNull();
  });

  it("forwards rest props to the portal element", async () => {
    render(PortalTest, {
      props: {
        class: "custom-portal-class",
        id: "test-portal-id",
        "data-testid": "portal-test",
        "aria-label": "Test portal",
        style: "background-color: red;",
      },
    });

    const portalContent = await screen.findByText("Portal content");
    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);

    expect(portalElement).toHaveClass("custom-portal-class");
    expect(portalElement).toHaveAttribute("id", "test-portal-id");
    expect(portalElement).toHaveAttribute("data-testid", "portal-test");
    expect(portalElement).toHaveAttribute("aria-label", "Test portal");
    expect(portalElement.getAttribute("style")).toContain("background-color");
  });

  describe("custom target", () => {
    it("mounts into the provided target element", async () => {
      const customTarget = document.createElement("div");
      customTarget.setAttribute("data-testid", "custom-target");
      document.body.appendChild(customTarget);

      render(PortalTest, { props: { target: customTarget } });

      const portalContent = await screen.findByText("Portal content");
      const portalElement = portalContent.closest("[data-portal]");
      assert(portalElement instanceof HTMLElement);

      expect(portalElement.parentElement).toBe(customTarget);
      expect(portalElement.parentElement).not.toBe(document.body);

      customTarget.remove();
    });

    it("moves the portal when target changes", async () => {
      const firstTarget = document.createElement("div");
      const secondTarget = document.createElement("div");
      document.body.appendChild(firstTarget);
      document.body.appendChild(secondTarget);

      const { rerender } = render(PortalTest, {
        props: { target: firstTarget },
      });

      const portalContent = await screen.findByText("Portal content");
      const portalElement = portalContent.closest("[data-portal]");
      assert(portalElement instanceof HTMLElement);

      expect(portalElement.parentElement).toBe(firstTarget);

      await rerender({ target: secondTarget });
      await tick();

      expect(portalElement.parentElement).toBe(secondTarget);

      firstTarget.remove();
      secondTarget.remove();
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
