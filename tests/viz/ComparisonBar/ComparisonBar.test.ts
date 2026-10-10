import { render, screen, within } from "@testing-library/svelte";
import ComparisonBar from "./ComparisonBar.test.svelte";

const rows = (id: string) =>
  within(screen.getByTestId(id))
    .getAllByRole("row")
    .slice(1)
    .map((row) => ({
      text: Array.from(row.children)
        .map((cell) => cell.textContent?.trim() ?? "")
        .filter(Boolean),
      pct: (row as HTMLElement).style.getPropertyValue("--bx-viz-pct"),
    }));

describe("ComparisonBar", () => {
  it("is a captioned table with a row for each period", () => {
    render(ComparisonBar);

    expect(screen.getByRole("table", { name: "Orders" })).toBeInTheDocument();
    expect(rows("basic")).toEqual([
      { text: ["This period", "1.3K"], pct: "100" },
      { text: ["Last period", "912"], pct: String((912 / 1284) * 100) },
    ]);
  });

  it("is decorative without a label and shows no delta by default", () => {
    render(ComparisonBar);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector(".bx--viz-delta")).toBeNull();
  });

  it("shows the relative change", () => {
    render(ComparisonBar);

    expect(
      screen.getByTestId("basic").querySelector(".bx--viz-delta"),
    ).toHaveTextContent("+40.8%");
  });

  it("scales against the larger value and passes the good direction on", () => {
    render(ComparisonBar);

    const root = screen.getByTestId("down");
    expect(rows("down")).toEqual([
      { text: ["Current", "40 ms"], pct: "50" },
      { text: ["Previous", "80 ms"], pct: "100" },
    ]);
    expect(root).toHaveClass("bx--viz-comparison-bar--sm");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
    const delta = root.querySelector(".bx--viz-delta");
    expect(delta).toHaveTextContent("-50%");
    expect(delta).toHaveClass("bx--viz-delta--success");
  });

  it("writes a dash for a missing baseline", () => {
    render(ComparisonBar);

    expect(rows("missing")[1]).toEqual({ text: ["Previous", "–"], pct: "0" });
    expect(
      within(screen.getByTestId("missing")).getAllByRole("row")[2],
    ).toHaveClass("bx--viz-comparison-bar__row--empty");
    expect(
      screen.getByTestId("missing").querySelector(".bx--viz-delta"),
    ).toHaveTextContent("–");
  });
});
