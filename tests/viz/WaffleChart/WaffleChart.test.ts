import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import WaffleChart from "./WaffleChart.test.svelte";

const cells = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<HTMLElement>(".bx--viz-waffle__cell"),
  );
const colorOf = (cell: HTMLElement) =>
  cell.style.getPropertyValue("--bx-viz-color");

describe("WaffleChart", () => {
  it("names the image with the label and every share", () => {
    render(WaffleChart);

    expect(
      screen.getByRole("img", {
        name: "Sessions, Desktop 53%, Mobile 31%, Tablet 11%, TV 4%, Watch 2%",
      }),
    ).toBe(screen.getByTestId("basic"));
  });

  it("is decorative without a label or a legend", () => {
    render(WaffleChart);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
    expect(root.querySelector(".bx--viz-waffle__legend")).toBeNull();
  });

  it("keeps the legend readable when there is no accessible name", () => {
    render(WaffleChart);

    const root = screen.getByTestId("labelled");
    expect(root).not.toHaveAttribute("aria-hidden");
    expect(
      within(root)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Desktop 53%", "Mobile 31%", "Tablet 11%", "TV 4%", "Watch 2%"]);
  });

  it("gives every part its cells so the hundred add up", () => {
    render(WaffleChart);

    const all = cells("basic");
    expect(all).toHaveLength(100);
    const counts = new Map<string, number>();
    for (const cell of all)
      counts.set(colorOf(cell), (counts.get(colorOf(cell)) ?? 0) + 1);
    expect([...counts.values()].sort((a, b) => b - a)).toEqual([
      52, 31, 11, 4, 2,
    ]);
    expect(
      all.some((cell) =>
        cell.classList.contains("bx--viz-waffle__cell--empty"),
      ),
    ).toBe(false);
  });

  it("fills from the bottom left and folds the tail on a small grid", () => {
    render(WaffleChart);

    const grid = cells("small");
    expect(grid).toHaveLength(10);
    // 2 rows x 5 columns: Desktop 5 cells, Mobile 3, Other 2. Desktop fills
    // two columns and the bottom of the third; Mobile the rest of it and
    // the fourth; Other the last.
    const bottom = grid.slice(5).map(colorOf);
    const top = grid.slice(0, 5).map(colorOf);
    expect(top.slice(0, 2)).toEqual(bottom.slice(0, 2));
    expect(bottom[2]).toBe(bottom[0]);
    expect(top[2]).toBe(bottom[3]);
    expect(top[2]).not.toBe(bottom[2]);
    expect(top[4]).toBe("var(--cds-viz-neutral)");
    expect(bottom[4]).toBe("var(--cds-viz-neutral)");
    expect(
      within(screen.getByTestId("small"))
        .getAllByRole("listitem")
        .map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Desktop 53%", "Mobile 31%", "Other 17%"]);
  });

  it("is a group of toggles that dim the other parts when selectable", async () => {
    const onselect = vi.fn();
    render(WaffleChart, { onselect });

    const group = screen.getByRole("group", { name: "Pick a device" });
    const keys = within(group).getAllByRole("button");
    expect(keys).toHaveLength(5);
    expect(keys.map((key) => key.tabIndex)).toEqual([0, -1, -1, -1, -1]);

    await user.click(keys[1]);
    expect(keys[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("mobile");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ index: 1, pct: 31 }),
    );
    expect(group).toHaveClass("bx--viz-waffle--has-selection");
    const selected = cells("selectable").filter((cell) =>
      cell.classList.contains("bx--viz-waffle__cell--selected"),
    );
    expect(selected).toHaveLength(31);

    await user.keyboard("{ArrowRight}");
    expect(keys[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("tablet");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
    expect(group).not.toHaveClass("bx--viz-waffle--has-selection");
  });
});
