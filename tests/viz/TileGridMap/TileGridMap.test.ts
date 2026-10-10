import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import TileGridMap from "./TileGridMap.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/utils/heat-grid.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/utils/heat-grid.js")
    >();
  return {
    ...actual,
    heatColor: (...args: Parameters<typeof actual.heatColor>) => {
      geometry.calls += 1;
      return actual.heatColor(...args);
    },
  };
});

const tile = (id: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>(".bx--viz-tile-map__tile"),
  ).find((node) => node.textContent?.trim() === id) as HTMLElement;

beforeEach(() => {
  geometry.calls = 0;
});

describe("TileGridMap", () => {
  it("places every state on the grid and colors it by its total", () => {
    render(TileGridMap);

    expect(document.querySelectorAll(".bx--viz-tile-map__tile")).toHaveLength(
      51,
    );
    expect(tile("CA").style.gridRow).toBe("5");
    expect(tile("CA").style.gridColumn).toBe("1");
    expect(tile("CA").style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
    expect(tile("NY").style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-02)",
    );
    // A null value is no data, not a zero, and so is a state with no row.
    expect(tile("WA")).toHaveClass("bx--viz-tile-map__tile--empty");
    expect(tile("OR")).toHaveClass("bx--viz-tile-map__tile--empty");
    expect(tile("OR")).toHaveAttribute("title", "Oregon: No data");
  });

  it("gives assistive technology every region as a table, by name", () => {
    render(TileGridMap);

    const table = screen.getByRole("table", { name: "Signups by state" });
    const rows = within(table)
      .getAllByRole("row")
      .map((row) =>
        Array.from(row.children).map((cell) => cell.textContent?.trim()),
      );
    expect(rows[0]).toEqual(["Region", "Value"]);
    expect(rows[1]).toEqual(["Alabama", "No data"]);
    expect(rows).toContainEqual(["California", "900"]);
    expect(rows).toHaveLength(52);
  });

  it("shows a tooltip on hover without coloring the tiles again", async () => {
    const onhover = vi.fn();
    render(TileGridMap, { onhover });
    const painted = geometry.calls;

    await fireEvent.mouseEnter(tile("TX"));
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "TX", label: "Texas", value: 300 }),
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /Texas\s*300/,
    );
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Texas: 300",
    );
    expect(geometry.calls).toBe(painted);

    await fireEvent.mouseLeave(tile("TX"));
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("is a set of toggles with arrow key navigation when selectable", async () => {
    const onselect = vi.fn();
    render(TileGridMap, { selectable: true, onselect });

    const buttons = document.querySelectorAll<HTMLElement>(
      ".bx--viz-tile-map__button",
    );
    expect(buttons).toHaveLength(51);
    expect(screen.getByRole("button", { name: "California, 900" })).toBe(
      tile("CA").querySelector("button"),
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(buttons[0].tabIndex).toBe(0);
    expect(buttons[1].tabIndex).toBe(-1);

    buttons[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(buttons[1]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        region: expect.objectContaining({ id: "ME", label: "Maine" }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("ME");
    expect(tile("ME")).toHaveClass("bx--viz-tile-map__tile--selected");

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
