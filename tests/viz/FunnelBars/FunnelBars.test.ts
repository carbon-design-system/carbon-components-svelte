import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import FunnelBars from "./FunnelBars.test.svelte";

const rows = () =>
  Array.from(screen.getByTestId("funnel").querySelectorAll("tbody tr"));
const pct = (row: Element) =>
  (row as HTMLElement).style.getPropertyValue("--bx-viz-pct");

describe("FunnelBars", () => {
  it("renders a captioned table with one row per stage", () => {
    render(FunnelBars);

    expect(
      screen.getByRole("table", {
        name: "Signup funnel. Overall conversion 9%",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("rowheader").map((cell) => cell.textContent?.trim()),
    ).toEqual(["Visitors", "Signup", "Activated", "Paid"]);
  });

  it("sizes bars relative to the largest stage", () => {
    render(FunnelBars);

    expect(rows().map(pct)).toEqual(["100", "60", "30", "9"]);
  });

  it("hides the bar column from assistive technology", () => {
    render(FunnelBars);

    for (const row of rows()) {
      expect(
        row.querySelector(".bx--viz-funnel-bars__track-cell"),
      ).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("is decorative without a label", () => {
    render(FunnelBars, { label: "" });

    const table = screen.getByTestId("funnel");
    expect(table).toHaveAttribute("aria-hidden", "true");
    expect(table.querySelector("caption")).toBeNull();
  });

  it.each([
    ["none", 0, []],
    ["step", 1, ["", "60%", "50%", "30%"]],
    ["overall", 1, ["100%", "60%", "30%", "9%"]],
    ["both", 2, ["", "60%", "50%", "30%"]],
  ] as const)("rate=%s renders %i rate column(s)", (rate, columns, first) => {
    render(FunnelBars, { rate });

    const cells = rows().map((row) =>
      Array.from(row.querySelectorAll(".bx--viz-funnel-bars__rate")),
    );
    expect(cells.every((list) => list.length === columns)).toBe(true);
    expect(cells.map((list) => list[0]?.textContent?.trim() ?? "")).toEqual(
      columns === 0 ? ["", "", "", ""] : first,
    );
  });

  it("shows what each stage lost and flags the largest drop with an icon", () => {
    render(FunnelBars, { showDrop: true, highlight: "largest-drop" });

    const [first, signup, activated] = rows();
    expect(first.querySelector(".bx--viz-funnel-bars__drop")).toBeNull();
    expect(signup.querySelector(".bx--viz-funnel-bars__drop")).not.toBeNull();
    expect(
      (signup as HTMLElement).style.getPropertyValue("--bx-viz-previous-pct"),
    ).toBe("100");
    expect(signup).toHaveClass("bx--viz-funnel-bars__row--highlight");
    expect(signup.querySelector("svg")).not.toBeNull();
    expect(signup).toHaveTextContent("40% drop, largest drop");
    expect(activated).not.toHaveClass("bx--viz-funnel-bars__row--highlight");
    expect(activated).toHaveTextContent("50% drop");
  });

  it("highlights a stage by id", () => {
    render(FunnelBars, { highlight: "paid" });

    expect(rows()[3]).toHaveClass("bx--viz-funnel-bars__row--highlight");
  });

  it("always notes a non-linear scale, visibly and in the caption", () => {
    render(FunnelBars, { scale: "sqrt" });

    expect(screen.getByText("Not to scale")).toBeVisible();
    expect(
      screen.getByRole("table").querySelector("caption"),
    ).toHaveTextContent("Signup funnel. Overall conversion 9%. Not to scale");
    expect(pct(rows()[3])).toBe("30");
  });

  it("applies the centered modifier", () => {
    render(FunnelBars, { align: "center" });

    expect(screen.getByTestId("funnel")).toHaveClass(
      "bx--viz-funnel-bars--center",
    );
  });

  it("routes colors through --bx-viz-color, per funnel and per stage", () => {
    render(FunnelBars, {
      color: 3,
      stages: [
        { id: "a", label: "A", value: 10 },
        { id: "b", label: "B", value: 5, color: "success" },
      ],
    });

    expect(
      screen.getByTestId("funnel").style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-cat-03)");
    expect(
      (rows()[1] as HTMLElement).style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-success)");
    expect(
      (rows()[0] as HTMLElement).style.getPropertyValue("--bx-viz-color"),
    ).toBe("");
  });

  it("renders a stage with href as a link", () => {
    render(FunnelBars, {
      stages: [{ id: "a", label: "Visitors", value: 10, href: "#visitors" }],
    });

    expect(screen.getByRole("link", { name: "Visitors" })).toHaveAttribute(
      "href",
      "#visitors",
    );
  });

  it("passes stage, stats, index, and formatted value to the slots", () => {
    render(FunnelBars, { withSlots: true });

    const [first, second] = rows();
    expect(first).toHaveTextContent("1. Visitors");
    expect(first).toHaveTextContent("[10K]");
    expect(first).toHaveTextContent("step:n/a");
    expect(second).toHaveTextContent("step:0.6");
  });

  it("keeps row nodes and updates only the geometry when stages are reassigned", async () => {
    const { rerender } = render(FunnelBars);
    const before = rows();

    await rerender({
      stages: [
        { id: "visit", label: "Visitors", value: 10000 },
        { id: "signup", label: "Signup", value: 8000 },
        { id: "activate", label: "Activated", value: 3000 },
        { id: "paid", label: "Paid", value: 900 },
      ],
    });

    const after = rows();
    expect(after.every((row, i) => row === before[i])).toBe(true);
    expect(after.map(pct)).toEqual(["100", "80", "30", "9"]);
  });

  it("dispatches update only when emitUpdate is set", async () => {
    const onupdate = vi.fn();
    const { rerender } = render(FunnelBars, { onupdate });
    await Promise.resolve();
    expect(onupdate).not.toHaveBeenCalled();

    await rerender({ emitUpdate: true });
    await vi.waitFor(() => expect(onupdate).toHaveBeenCalled());
    expect(onupdate).toHaveBeenLastCalledWith({
      count: 4,
      domain: [0, 10000],
      stats: { overallRate: 0.09, largestDropIndex: 1, total: 10000 },
    });
  });

  describe("selectable", () => {
    it("renders no buttons when off", () => {
      render(FunnelBars);

      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("exposes one tab stop, on the selected stage", () => {
      render(FunnelBars, { selectable: true, selectedId: "activate" });

      const buttons = screen.getAllByRole("button");
      expect(buttons.map((button) => button.tabIndex)).toEqual([-1, -1, 0, -1]);
      expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual([
        "false",
        "false",
        "true",
        "false",
      ]);
    });

    it("moves focus with the arrow keys without selecting, and wraps", async () => {
      const onselect = vi.fn();
      render(FunnelBars, { selectable: true, selectedId: "paid", onselect });

      screen.getByRole("button", { name: "Paid" }).focus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Visitors" })).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("button", { name: "Paid" })).toHaveFocus();
      expect(onselect).not.toHaveBeenCalled();
      expect(screen.getByTestId("selected")).toHaveTextContent("paid");
    });

    it("selects with Enter and by clicking anywhere on the row", async () => {
      const onselect = vi.fn();
      render(FunnelBars, { selectable: true, onselect });

      screen.getByRole("button", { name: "Signup" }).focus();
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("selected")).toHaveTextContent("signup");
      expect(onselect).toHaveBeenCalledTimes(1);
      expect(onselect.mock.calls[0][0]).toMatchObject({
        index: 1,
        stage: { id: "signup" },
        stats: { stepRate: 0.6 },
      });

      const value = within(rows()[3] as HTMLElement).getByText("900");
      await user.click(value);
      expect(screen.getByTestId("selected")).toHaveTextContent("paid");
      expect(onselect).toHaveBeenCalledTimes(2);
    });

    it("does not dispatch select when selectedId is set from outside", async () => {
      const onselect = vi.fn();
      const { rerender } = render(FunnelBars, { selectable: true, onselect });

      await rerender({ selectedId: "paid" });
      expect(screen.getByRole("button", { name: "Paid" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(onselect).not.toHaveBeenCalled();
    });

    it("reports hover on pointer and focus, and null on leave", async () => {
      const onhover = vi.fn();
      render(FunnelBars, { selectable: true, onhover });

      await user.hover(rows()[1]);
      expect(onhover).toHaveBeenLastCalledWith(
        expect.objectContaining({ index: 1 }),
      );
      await user.unhover(rows()[1]);
      expect(onhover).toHaveBeenLastCalledWith(null);
    });
  });
});
