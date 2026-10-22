import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import RankBars from "./RankBars.test.svelte";

const cells = (id: string) =>
  within(screen.getByTestId(id))
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      Array.from(row.children)
        .map((cell) => cell.textContent?.trim() ?? "")
        .filter(Boolean),
    );

describe("RankBars", () => {
  it("is a captioned table of ranked rows, sorted by value", () => {
    render(RankBars);

    expect(screen.getByRole("table", { name: "Browser share" })).toBe(
      screen.getByTestId("basic"),
    );
    expect(cells("basic")).toEqual([
      ["1", "Chrome", "64"],
      ["2", "Safari", "19"],
      ["3", "Opera", "8"],
      ["4", "Edge", "5"],
      ["5", "Firefox", "4"],
    ]);
    expect(
      within(screen.getByTestId("basic"))
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Rank", "Item", "Value"]);
  });

  it("is decorative without a label", () => {
    render(RankBars);

    expect(screen.getByTestId("decorative")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("sizes bars against the largest row and colors them", () => {
    render(RankBars);

    const root = screen.getByTestId("basic");
    const rows = Array.from(
      root.querySelectorAll<HTMLElement>(".bx--viz-rank-bars__row"),
    );
    expect(rows[0].style.getPropertyValue("--bx-viz-pct")).toBe("100");
    expect(rows[3].style.getPropertyValue("--bx-viz-pct")).toBe("7.8125");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe("");
    expect(rows[1].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
  });

  it("links a row that has an href", () => {
    render(RankBars);

    expect(
      within(screen.getByTestId("basic")).getByRole("link", { name: "Chrome" }),
    ).toHaveAttribute("href", "/chrome");
  });

  it("keeps the top rows, folds the rest, and writes shares", () => {
    render(RankBars);

    const root = screen.getByTestId("top");
    expect(cells("top")).toEqual([
      ["1", "Chrome", "64%"],
      ["2", "Safari", "19%"],
      ["3", "Opera", "8%"],
      ["Rest", "9%"],
    ]);
    expect(root).toHaveClass("bx--viz-rank-bars--sm");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-cat-03)",
    );
    const other = root.querySelector<HTMLElement>(
      ".bx--viz-rank-bars__row--other",
    );
    expect(other?.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-neutral)",
    );
  });

  it("keeps the input order, hides ranks, and formats values", () => {
    render(RankBars);

    expect(cells("unsorted")[0]).toEqual(["Edge", "5 pts"]);
    expect(
      within(screen.getByTestId("unsorted")).getAllByRole("columnheader"),
    ).toHaveLength(2);
  });

  it("renders no buttons unless selectable", () => {
    render(RankBars);

    expect(
      within(screen.getByTestId("basic")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("selects by click and keyboard with one tab stop", async () => {
    const onselect = vi.fn();
    const onhover = vi.fn();
    render(RankBars, { props: { onselect, onhover } });

    const buttons = within(screen.getByTestId("selectable")).getAllByRole(
      "button",
    );
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("safari");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      item: { id: "safari" },
      rank: 2,
    });
    expect(onhover).toHaveBeenCalledWith(expect.objectContaining({ rank: 2 }));

    await user.keyboard("{ArrowDown}");
    expect(buttons[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("opera");
  });
});
