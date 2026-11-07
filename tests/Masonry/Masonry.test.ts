import { render, screen, waitFor } from "@testing-library/svelte";
import Masonry from "./Masonry.test.svelte";

// jsdom has no layout. Each item reports the height in its `data-height`, and
// the container reports the grid the styles would give it.
function stubLayout(initial = "grid") {
  const layout = { display: initial };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const height = Number(this.getAttribute("data-height") ?? 0);
      return { height, width: 100 } as DOMRect;
    },
  );
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
    const style = real(el, pseudo);
    if (!(el instanceof HTMLElement) || !el.classList.contains("bx--masonry"))
      return style;
    return new Proxy(style, {
      get: (target, key) => {
        if (key === "display") return layout.display;
        if (key === "gridTemplateColumns") return "100px 100px";
        if (key === "rowGap") return "10px";
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  });
  return layout;
}

afterEach(() => vi.restoreAllMocks());

const place = (testId: string) => {
  const item = screen.getByTestId(testId);
  return [
    item.style.getPropertyValue("--ccs-masonry-column"),
    item.style.getPropertyValue("--ccs-masonry-top"),
  ];
};

describe("Masonry", () => {
  it("renders the container with its classes and passes the rest through", () => {
    render(Masonry);

    const node = screen.getByTestId("masonry");
    expect(node.tagName).toBe("DIV");
    expect(node).toHaveClass("bx--masonry", "bx--masonry--gap-5", "custom");
    expect(node).not.toHaveClass("bx--masonry--js");
    expect(node).not.toHaveClass("bx--masonry--columns");
    expect(node.style.color).toBe("red");
    expect(node.children).toHaveLength(4);
  });

  it("sets the column width, a fixed column count and the gap", async () => {
    const { rerender } = render(Masonry, { columnWidth: "12rem", gap: "2rem" });

    const node = screen.getByTestId("masonry");
    expect(node.style.getPropertyValue("--ccs-masonry-column-width")).toBe(
      "12rem",
    );
    expect(node.style.getPropertyValue("--ccs-masonry-gap")).toBe("2rem");
    expect(node.className).not.toContain("bx--masonry--gap-");

    await rerender({ columns: 3, gap: 0 });
    expect(node).toHaveClass("bx--masonry--columns", "bx--masonry--gap-0");
    expect(node.style.getPropertyValue("--ccs-masonry-columns")).toBe("3");
    expect(node.style.getPropertyValue("--ccs-masonry-column-width")).toBe("");
  });

  it("marks script placement and the hidden state", () => {
    render(Masonry, { native: false, hideUntilPlaced: true });

    expect(screen.getByTestId("masonry")).toHaveClass(
      "bx--masonry--js",
      "bx--masonry--hide-until-placed",
    );
  });

  it("renders the given tag and follows it in `ref`", async () => {
    const { rerender } = render(Masonry, { tag: "ul" });
    expect(screen.getByTestId("masonry").tagName).toBe("UL");

    await rerender({ tag: "section" });
    expect(screen.getByTestId("masonry").tagName).toBe("SECTION");
  });

  it("puts each item in the shortest column, in order", async () => {
    stubLayout();
    render(Masonry, { heights: [100, 50, 80, 30] });

    const node = screen.getByTestId("masonry");
    await waitFor(() => expect(node).toHaveClass("bx--masonry--placed"));
    // Column 1 takes 100, column 2 takes 50 and then 80 (50 + 10 gap is
    // shorter than 100 + 10), and the 30 goes under the 80 in column 2.
    expect(place("item-0")).toEqual(["1", "0px"]);
    expect(place("item-1")).toEqual(["2", "0px"]);
    expect(place("item-2")).toEqual(["2", "60px"]);
    expect(place("item-3")).toEqual(["1", "110px"]);
    expect(node.style.getPropertyValue("--ccs-masonry-height")).toBe("140px");
  });

  it("repacks when an item is added", async () => {
    stubLayout();
    const { rerender } = render(Masonry, { heights: [100, 50] });
    await waitFor(() =>
      expect(screen.getByTestId("masonry")).toHaveClass("bx--masonry--placed"),
    );

    await rerender({ heights: [100, 50, 20] });
    await waitFor(() => expect(place("item-2")).toEqual(["2", "60px"]));
  });

  it("leaves the packing to the browser when it has display: grid-lanes", async () => {
    stubLayout("grid-lanes");
    render(Masonry);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId("masonry")).not.toHaveClass(
      "bx--masonry--placed",
    );
    expect(place("item-0")).toEqual(["", ""]);
  });

  it("starts packing by script when `native` is turned off", async () => {
    const layout = stubLayout("grid-lanes");
    const { rerender } = render(Masonry, { native: true });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId("masonry")).not.toHaveClass(
      "bx--masonry--placed",
    );

    // The `bx--masonry--js` class takes the lanes display away.
    layout.display = "grid";
    await rerender({ native: false });
    await waitFor(() =>
      expect(screen.getByTestId("masonry")).toHaveClass("bx--masonry--placed"),
    );
    expect(place("item-1")).toEqual(["2", "0px"]);
  });
});
