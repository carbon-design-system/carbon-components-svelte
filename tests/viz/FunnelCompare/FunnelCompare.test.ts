import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import FunnelCompare from "./FunnelCompare.test.svelte";

const table = () =>
  screen.getByRole("table", { name: "Signup funnel by channel" });
const rowText = () =>
  within(table())
    .getAllByRole("row")
    .map((row) =>
      Array.from(row.children)
        .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean),
    );
const pcts = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>(
      "tbody .bx--viz-funnel-compare__cell",
    ),
  ).map((cell) =>
    Math.round(Number(cell.style.getPropertyValue("--bx-viz-pct"))),
  );

describe("FunnelCompare", () => {
  it("lines stages up by id across funnels and closes with each overall rate", () => {
    render(FunnelCompare);

    expect(rowText()).toEqual([
      ["Stage", "Organic", "Paid"],
      ["Visit", "10K", "8K"],
      ["Signup", "6K", "3K"],
      ["Paid", "1.2K", "640"],
      ["Trial", "–", "1.5K"],
      ["Overall conversion", "12%", "8%"],
    ]);
  });

  it("scales every bar against the largest stage of any funnel", () => {
    render(FunnelCompare);

    expect(pcts()).toEqual([100, 80, 60, 30, 12, 6, 0, 15]);
  });

  it("scales each funnel against its own largest stage when independent", () => {
    render(FunnelCompare, { scale: "independent" });

    expect(pcts()).toEqual([100, 100, 60, 38, 12, 8, 0, 19]);
  });

  it("drops the footer without a rate and is decorative without a label", () => {
    render(FunnelCompare, { rate: "none", label: "" });

    const root = screen.getByTestId("compare");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector("tfoot")).toBeNull();
  });

  it("colors a funnel's bars by its own color", () => {
    render(FunnelCompare);

    const cells = table().querySelectorAll<HTMLElement>(
      ".bx--viz-funnel-compare__cell",
    );
    expect(cells[0].style.getPropertyValue("--bx-viz-color")).toBe("");
    expect(cells[1].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
  });

  it("is a set of named toggles with one tab stop when selectable", async () => {
    const onselect = vi.fn();
    render(FunnelCompare, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    // Seven bars: the organic funnel has no trial stage.
    expect(buttons).toHaveLength(7);
    expect(buttons.map((button) => button.tabIndex)).toEqual([
      0, -1, -1, -1, -1, -1, -1,
    ]);
    expect(buttons[1]).toHaveAccessibleName("Paid, Visit: 8K");

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        funnel: { id: "paid", label: "Paid" },
        stage: expect.objectContaining({ index: 0 }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("paid/visit");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
