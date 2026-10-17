import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { get } from "svelte/store";
import {
  isHeaderRendered,
  isSideNavMobile,
} from "../../src/UIShell/nav-store.js";
import UIShellContainer from "./UIShellContainer.test.svelte";

/**
 * A ResizeObserver that reports each element's `data-width` as its width
 * when observed, as the browser would on first observe.
 */
class FakeResizeObserver {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const width = Number((target as HTMLElement).dataset.width ?? 0);
    this.callback(
      [{ target, contentRect: { width } } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

const shell = (i: number) => screen.getByTestId(`shell-${i}`);
// A collapsed nav is aria-hidden, so find it by its label directly.
const sideNav = (i: number) =>
  shell(i).querySelector(`nav[aria-label="Nav ${i}"]`) as HTMLElement;

describe("UIShellContainer", () => {
  const OriginalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    // A fresh class per test: the shared observer is cached per constructor.
    globalThis.ResizeObserver = class extends FakeResizeObserver {};
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
    setViewportWidth(1024);
  });

  it("follows its own width, not the window's", async () => {
    setViewportWidth(500);
    render(UIShellContainer, { props: { widths: [1200] } });
    await tick();

    expect(sideNav(0)).toHaveClass("bx--side-nav--expanded");
    expect(
      within(shell(0)).queryByRole("button", { name: /menu/i }),
    ).toBeNull();
  });

  it("keeps two shells' state apart", async () => {
    setViewportWidth(1600);
    render(UIShellContainer, { props: { widths: [1200, 600] } });
    await tick();

    // Wide: expanded, no hamburger. Narrow: collapsed behind a hamburger.
    expect(sideNav(0)).toHaveClass("bx--side-nav--expanded");
    expect(sideNav(1)).not.toHaveClass("bx--side-nav--expanded");
    expect(
      within(shell(0)).queryByRole("button", { name: /menu/i }),
    ).toBeNull();
    const hamburger = within(shell(1)).getByRole("button", {
      name: "Open menu",
    });

    await fireEvent.click(hamburger);
    expect(sideNav(1)).toHaveClass("bx--side-nav--expanded");
    expect(sideNav(0)).toHaveClass("bx--side-nav--expanded");
  });

  it("leaves the page-wide stores alone", async () => {
    setViewportWidth(1600);
    render(UIShellContainer, { props: { widths: [600] } });
    await tick();

    // A contained header doesn't offset sticky toolbars on the page, and a
    // narrow container doesn't put the page's own shell in mobile mode.
    expect(get(isHeaderRendered)).toBe(false);
    expect(get(isSideNavMobile)).toBe(false);
  });

  it("doesn't lock the page's scroll when its nav opens over it", async () => {
    setViewportWidth(1600);
    render(UIShellContainer, { props: { widths: [600] } });
    await tick();

    await fireEvent.click(
      within(shell(0)).getByRole("button", { name: "Open menu" }),
    );
    expect(sideNav(0)).toHaveClass("bx--side-nav--expanded");
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
  });

  it("applies its height and container class", () => {
    render(UIShellContainer, { props: { widths: [1200] } });
    expect(shell(0)).toHaveClass("bx--ui-shell-container");
    expect(shell(0).style.height).toBe("30rem");
  });

  it("grows with its content when no height is set", () => {
    render(UIShellContainer, { props: { widths: [1200], fixedHeight: false } });
    expect(shell(0).style.height).toBe("");
  });

  it("renders content as a div with an id unique to each shell", async () => {
    render(UIShellContainer, { props: { widths: [1200, 1200] } });
    await tick();

    const contents = [0, 1].map(
      (i) => shell(i).querySelector(".bx--content") as HTMLElement,
    );
    expect(contents[0].tagName).toBe("DIV");
    expect(contents[0].id).not.toBe("main-content");
    expect(contents[0].id).not.toBe(contents[1].id);
    // Each shell's skip link targets its own content.
    for (const [i, content] of contents.entries()) {
      expect(
        within(shell(i)).getByText("Skip to main content").closest("a"),
      ).toHaveAttribute("href", `#${content.id}`);
    }
  });

  it("sets its theme apart from the page's", () => {
    render(UIShellContainer, { props: { widths: [1200], theme: "g100" } });
    expect(shell(0)).toHaveAttribute("theme", "g100");
  });

  it("reports the container's breakpoint, not the window's", async () => {
    setViewportWidth(1600);
    render(UIShellContainer, { props: { widths: [800, 1100] } });
    await tick();

    expect(screen.getByTestId("size-0")).toHaveTextContent("md");
    expect(screen.getByTestId("size-1")).toHaveTextContent("lg");
  });

  it("takes a number of pixels as its height", () => {
    render(UIShellContainer, { props: { widths: [1200], height: 400 } });
    expect(shell(0).style.height).toBe("400px");
  });

  it("expands to fill the window and locks the page's scroll", async () => {
    const { rerender } = render(UIShellContainer, {
      props: { widths: [1200] },
    });
    await tick();
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");

    await rerender({ expanded: true });
    await tick();
    expect(shell(0)).toHaveClass("bx--ui-shell-container--expanded");
    // The fixed inset sizes it; an inline height would cut it short.
    expect(shell(0).style.height).toBe("");
    expect(document.body).toHaveClass("bx--body--with-modal-open");

    await rerender({ expanded: false });
    await tick();
    expect(shell(0)).not.toHaveClass("bx--ui-shell-container--expanded");
    expect(shell(0).style.height).toBe("30rem");
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
  });

  it("releases the page's scroll when unmounted while expanded", async () => {
    const { unmount } = render(UIShellContainer, {
      props: { widths: [1200], expanded: true },
    });
    await tick();
    expect(document.body).toHaveClass("bx--body--with-modal-open");

    unmount();
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
  });
});

describe("Content outside a container", () => {
  it("keeps the main landmark and its default id", async () => {
    const { default: Content } = await import(
      "../../src/UIShell/Content.svelte"
    );
    render(Content);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
