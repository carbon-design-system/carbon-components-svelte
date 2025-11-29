import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import PortalMultipleTest from "./Portal.multiple.test.svelte";
import PortalTest from "./Portal.test.svelte";

describe("Portal", () => {
  afterEach(() => {
    const existingPortals = document.querySelectorAll("[data-portal]");
    for (const portal of existingPortals) {
      portal.remove();
    }
  });

  it("renders portal content", async () => {
    render(PortalTest);

    const portalContent = await screen.findByText("Portal content");
    expect(portalContent).toBeInTheDocument();

    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);
    expect(portalElement.parentElement).toBe(document.body);
    expect(portalElement.tagName).toBe("DIV");
  });

  it("multiple portals each have their own instance", async () => {
    render(PortalMultipleTest);

    const portalContent1 = await screen.findByText("Portal content 1");
    const portalContent2 = await screen.findByText("Portal content 2");
    const portalContent3 = await screen.findByText("Portal content 3");

    expect(portalContent1).toBeInTheDocument();
    expect(portalContent2).toBeInTheDocument();
    expect(portalContent3).toBeInTheDocument();

    const portalElement1 = portalContent1.closest("[data-portal]");
    const portalElement2 = portalContent2.closest("[data-portal]");
    const portalElement3 = portalContent3.closest("[data-portal]");

    expect(portalElement1).not.toBe(portalElement2);
    expect(portalElement2).not.toBe(portalElement3);
    expect(portalElement1).not.toBe(portalElement3);
    expect(portalElement1).toBeInTheDocument();
    expect(portalElement2).toBeInTheDocument();
    expect(portalElement3).toBeInTheDocument();
  });

  it("removes portal element when instance is unmounted", async () => {
    const { unmount } = render(PortalTest);

    const portalContent = await screen.findByText("Portal content");
    const portalElement = portalContent.closest("[data-portal]");
    assert(portalElement instanceof HTMLElement);

    unmount();

    const remainingPortal = document.querySelector("[data-portal]");
    expect(remainingPortal).not.toBeInTheDocument();
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

  it("renders slot content correctly", async () => {
    render(PortalTest, {
      props: { portalContent: "Custom portal content" },
    });

    const portalContent = await screen.findByText("Custom portal content");
    expect(portalContent).toBeInTheDocument();
  });

  it("handles conditional rendering", async () => {
    const { component } = render(PortalTest, {
      props: { showPortal: false },
    });

    let portalContent = screen.queryByText("Portal content");
    expect(portalContent).not.toBeInTheDocument();

    let portalElement = document.querySelector("[data-portal]");
    expect(portalElement).not.toBeInTheDocument();

    component.$set({ showPortal: true });

    portalContent = await screen.findByText("Portal content");
    expect(portalContent).toBeInTheDocument();

    portalElement = portalContent.closest("[data-portal]");
    expect(portalElement).toBeInTheDocument();

    component.$set({ showPortal: false });
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

  it("supports different custom tags", async () => {
    const { unmount: unmount1 } = render(PortalTest, {
      props: { portalContent: "Article portal", tag: "article" },
    });

    const portalContent1 = await screen.findByText("Article portal");
    const portalElement1 = portalContent1.closest("[data-portal]");
    assert(portalElement1 instanceof HTMLElement);
    expect(portalElement1.tagName).toBe("ARTICLE");

    const { unmount: unmount2 } = render(PortalTest, {
      props: { portalContent: "Section portal", tag: "section" },
    });

    const portalContent2 = await screen.findByText("Section portal");
    const portalElement2 = portalContent2.closest("[data-portal]");
    assert(portalElement2 instanceof HTMLElement);
    expect(portalElement2.tagName).toBe("SECTION");

    unmount1();
    unmount2();
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
});
