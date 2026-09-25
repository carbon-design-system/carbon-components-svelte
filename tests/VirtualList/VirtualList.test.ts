import { fireEvent, render, screen } from "@testing-library/svelte";
import VirtualList from "./VirtualList.test.svelte";

describe("VirtualList", () => {
  it("renders only a windowed slice of a large list", () => {
    render(VirtualList);

    // 200px container / 40px rows ≈ 5 rows visible; overscan adds a few more,
    // nowhere near all 500.
    expect(screen.getAllByTestId(/^row-/).length).toBeLessThan(50);
    expect(screen.queryByTestId("row-499")).not.toBeInTheDocument();
  });

  it("windows short lists by default", () => {
    render(VirtualList);

    // 5 visible rows plus 3 overscan below.
    expect(screen.getAllByTestId(/^short-row-/)).toHaveLength(8);
  });

  it("renders every item when the list is below threshold", () => {
    render(VirtualList);

    expect(screen.getAllByTestId(/^unwindowed-row-/)).toHaveLength(20);
  });

  it("fires scrollend with scroll metrics when scrolled near the bottom", async () => {
    render(VirtualList);

    const container = screen.getByTestId("large");
    Object.defineProperty(container, "scrollHeight", {
      value: 20000,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 200,
      configurable: true,
    });
    container.scrollTop = 19800;
    await fireEvent.scroll(container);

    expect(screen.getByTestId("scrollend-count")).toHaveTextContent("1");
    expect(
      JSON.parse(screen.getByTestId("scrollend-detail").textContent ?? ""),
    ).toEqual({ scrollTop: 19800, scrollHeight: 20000, clientHeight: 200 });
    expect(screen.getByTestId("row-499")).toBeInTheDocument();
  });

  it("windows against scrollElement instead of its own container", async () => {
    render(VirtualList);

    const list = screen.getByTestId("external");
    expect(list.style.height).toBe("");

    // jsdom has no layout: place the list 4000px above the scroller's top.
    list.getBoundingClientRect = () => ({ top: -4000 }) as DOMRect;
    const scroller = screen.getByTestId("scroller");
    scroller.scrollTop = 4000;
    await fireEvent.scroll(scroller);

    expect(screen.getByTestId("external-row-100")).toBeInTheDocument();
    expect(screen.queryByTestId("external-row-0")).not.toBeInTheDocument();
  });
});
