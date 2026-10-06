import { render, screen } from "@testing-library/svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import TableOfContents from "./TableOfContents.test.svelte";

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// Viewport-relative section tops, keyed by element id.
let tops: Record<string, number> = {};

describe("TableOfContents", () => {
  beforeEach(() => {
    tops = { overview: 0, "measures-of-success": 400, "key-moments": 800 };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return rect({ top: tops[this.id] ?? 0 });
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a labelled nav of section links", () => {
    render(TableOfContents, { noScrollSpy: true });

    const nav = screen.getByRole("navigation", { name: "Table of contents" });
    expect(nav).toHaveClass("bx--toc");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "#overview",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("indents and marks items below the first level", () => {
    render(TableOfContents, { noScrollSpy: true });

    const nested = screen.getByRole("link", {
      name: "Key moments",
    }).parentElement;
    expect(nested?.style.getPropertyValue("--ccs-toc-level")).toBe("2");
    expect(nested).toHaveClass("bx--toc__item--nested");

    const top = screen.getByRole("link", { name: "Overview" }).parentElement;
    expect(top?.style.getPropertyValue("--ccs-toc-level")).toBe("");
    expect(top).not.toHaveClass("bx--toc__item--nested");
  });

  it("clamps level to 3", () => {
    // Plain JavaScript callers can pass any number.
    render(TableOfContents, {
      noScrollSpy: true,
      nestedLevel: 5 as unknown as 3,
    });

    const nested = screen.getByRole("link", {
      name: "Key moments",
    }).parentElement;
    expect(nested?.style.getPropertyValue("--ccs-toc-level")).toBe("3");
  });

  it("marks the selectedId item with aria-current", () => {
    render(TableOfContents, { selectedId: "key-moments", noScrollSpy: true });

    const link = screen.getByRole("link", { name: "Key moments" });
    expect(link).toHaveAttribute("aria-current", "location");
    expect(link.parentElement).toHaveClass("bx--toc__item--active");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("tracks links with a path to the current page", () => {
    render(TableOfContents, {
      selectedId: "key-moments",
      noScrollSpy: true,
      hrefPrefix: window.location.pathname,
    });

    expect(screen.getByRole("link", { name: "Key moments" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("doesn't track links to another page", () => {
    render(TableOfContents, {
      selectedId: "key-moments",
      noScrollSpy: true,
      hrefPrefix: "/elsewhere",
    });

    expect(
      screen.getByRole("link", { name: "Key moments" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("selects an item on click and dispatches change", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { noScrollSpy: true, onChange });

    await user.click(screen.getByRole("link", { name: "Measures of success" }));

    expect(onChange).toHaveBeenCalledWith("measures-of-success");
    expect(screen.getByTestId("selected-id")).toHaveTextContent(
      "measures-of-success",
    );
    expect(
      screen.getByRole("link", { name: "Measures of success" }),
    ).toHaveAttribute("aria-current", "location");
  });

  it("ignores modified clicks that open a new tab or window", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { noScrollSpy: true, onChange });

    const link = screen.getByRole("link", { name: "Key moments" });
    // Cancel navigation so jsdom doesn't try to open a window.
    link.addEventListener("click", (event) => event.preventDefault());
    await user.keyboard("[ControlLeft>]");
    await user.click(link);
    await user.keyboard("[/ControlLeft]");

    expect(onChange).not.toHaveBeenCalled();
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("selects on a click a router has cancelled", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { noScrollSpy: true, onChange });

    const link = screen.getByRole("link", { name: "Key moments" });
    document.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    });
    await user.click(link);

    expect(onChange).toHaveBeenCalledWith("key-moments");
  });

  it("keeps the native hash jump for a top-level window", async () => {
    render(TableOfContents, { noScrollSpy: true });

    const link = screen.getByRole("link", { name: "Key moments" });
    let prevented: boolean | undefined;
    link.addEventListener("click", (event) => {
      prevented = event.defaultPrevented;
      event.preventDefault(); // jsdom doesn't implement navigation
    });
    // Runs after the item's own handler, which is attached first.
    await user.click(link);

    expect(prevented).toBe(false);
  });

  it("scrolls only the scroll container when one is set", async () => {
    const container = document.createElement("div");
    container.scrollTo = vi.fn();
    tops = { ...tops, "key-moments": 300 };
    render(TableOfContents, { noScrollSpy: true, scrollContainer: container });

    const link = screen.getByRole("link", { name: "Key moments" });
    let prevented: boolean | undefined;
    link.addEventListener("click", (event) => {
      prevented = event.defaultPrevented;
    });
    await user.click(link);

    expect(prevented).toBe(true);
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 300 });
    expect(screen.getByTestId("selected-id")).toHaveTextContent("key-moments");
    // Focus follows, as after a native hash jump.
    expect(document.activeElement).toBe(document.getElementById("key-moments"));
  });

  it("activates the first section on mount without dispatching change", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { onChange });
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent("overview");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("dispatches change when the spy overrides an initial selectedId", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { selectedId: "key-moments", onChange });
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent("overview");
    expect(onChange).toHaveBeenCalledWith("overview");
  });

  it("tracks the section that has scrolled past the top", async () => {
    const onChange = vi.fn();
    render(TableOfContents, { onChange });
    await nextFrame();

    tops = { overview: -500, "measures-of-success": -100, "key-moments": 300 };
    window.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent(
      "measures-of-success",
    );
    expect(onChange).toHaveBeenLastCalledWith("measures-of-success");
  });

  it("activates a section as soon as it scrolls into view with activationLine 1", async () => {
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 600,
    });
    try {
      render(TableOfContents, { activationLine: 1 });
      await nextFrame();

      // Tops at 0, 400, and 800: the second is in view, the third isn't.
      expect(screen.getByTestId("selected-id")).toHaveTextContent(
        "measures-of-success",
      );
    } finally {
      // Fall back to the prototype getter.
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });

  it("re-checks the active section when scrollOffset changes", async () => {
    render(TableOfContents);
    await nextFrame();
    expect(screen.getByTestId("selected-id")).toHaveTextContent("overview");

    await user.click(screen.getByRole("button", { name: "Grow header" }));
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent(
      "measures-of-success",
    );
  });

  it("keeps a clicked item active while the page scrolls to it", async () => {
    render(TableOfContents);
    await nextFrame();

    await user.click(screen.getByRole("link", { name: "Key moments" }));
    // Mid smooth-scroll, an earlier section is at the top.
    tops = { overview: -500, "measures-of-success": -100, "key-moments": 300 };
    window.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent("key-moments");
  });

  it("ignores scrolling when noScrollSpy is set", async () => {
    render(TableOfContents, { selectedId: "key-moments", noScrollSpy: true });
    await nextFrame();

    window.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(screen.getByTestId("selected-id")).toHaveTextContent("key-moments");
  });

  it("shows the active bar once it is measured", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(32);
    render(TableOfContents, { selectedId: "overview", noScrollSpy: true });

    const nav = screen.getByTestId("toc");
    const bar = nav.querySelector(".bx--toc__bar");
    expect(nav).not.toHaveClass("bx--toc--measured");
    expect(bar).toHaveAttribute("aria-hidden", "true");

    await nextFrame();

    expect(nav).toHaveClass("bx--toc--measured");
    expect(bar).toHaveStyle({ opacity: "1" });
  });

  it("places the bar without sliding once a hidden nav shows", async () => {
    const offsetHeight = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(0);
    render(TableOfContents, { selectedId: "overview", noScrollSpy: true });
    await nextFrame();

    const nav = screen.getByTestId("toc");
    expect(nav).not.toHaveClass("bx--toc--measured");

    offsetHeight.mockReturnValue(32);
    await user.click(screen.getByRole("link", { name: "Key moments" }));
    await nextFrame();

    expect(nav).toHaveClass("bx--toc--measured");
    expect(nav.querySelector(".bx--toc__bar")).not.toHaveClass(
      "bx--toc__bar--animated",
    );
  });
});
