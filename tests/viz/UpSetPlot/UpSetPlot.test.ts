import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import UpSetPlot from "./UpSetPlot.test.svelte";

const table = () => screen.getByRole("table", { name: "Tag combinations" });
const rows = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>("tbody .bx--viz-upset__row"),
  );
const cells = (row: HTMLElement) =>
  Array.from(row.querySelectorAll<HTMLElement>(".bx--viz-upset__cell"));

describe("UpSetPlot", () => {
  it("lists combinations largest first, with a bar and the set dots", () => {
    render(UpSetPlot);

    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent?.trim()),
    ).toEqual([
      "Alpha and Beta",
      "Alpha and Beta and Gamma",
      "Alpha only",
      "Gamma only",
      "Total",
    ]);
    const first = rows()[0];
    expect(
      first
        .querySelector<HTMLElement>(".bx--viz-upset__bar")
        ?.style.getPropertyValue("--bx-viz-pct"),
    ).toBe("100");
    expect(first.querySelector(".bx--viz-upset__value")).toHaveTextContent("3");
    expect(
      cells(first).map((cell) =>
        cell.classList.contains("bx--viz-upset__cell--member"),
      ),
    ).toEqual([true, true, false]);
  });

  it("joins the dots between the first and last member of a combination", () => {
    render(UpSetPlot);

    // Alpha and Beta and Gamma: Beta sits between the ends.
    const all = rows()[1];
    expect(
      cells(all).map((cell) =>
        cell.classList.contains("bx--viz-upset__cell--linked"),
      ),
    ).toEqual([false, true, false]);
    expect(
      cells(rows()[0]).some((cell) =>
        cell.classList.contains("bx--viz-upset__cell--linked"),
      ),
    ).toBe(false);
  });

  it("says in words which sets each combination is in, and totals each set", () => {
    render(UpSetPlot);

    const only = rows()[2];
    expect(
      cells(only).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["in Alpha", "not in Beta", "not in Gamma"]);
    const totals = Array.from(
      table().querySelectorAll(".bx--viz-upset__total-value"),
    ).map((node) => node.textContent?.trim());
    expect(totals).toEqual(["6", "5", "3"]);
  });

  it("writes shares when asked", () => {
    render(UpSetPlot, { valueType: "percent" });
    expect(rows()[0].querySelector(".bx--viz-upset__value")).toHaveTextContent(
      "43%",
    );
  });

  it("reports hover with the combination and its rows", async () => {
    const onhover = vi.fn();
    render(UpSetPlot, { onhover });

    await fireEvent.mouseEnter(rows()[1]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: "a+b+c", size: 2, ids: ["a", "b", "c"] }),
    );
    expect(
      onhover.mock.calls.at(-1)?.[0].rows.map((row: { id: number }) => row.id),
    ).toEqual([1, 2]);
    await fireEvent.mouseLeave(rows()[1]);
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("selects a combination, with one tab stop and arrow keys between rows", async () => {
    const onselect = vi.fn();
    render(UpSetPlot, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1]);

    buttons[0].focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        combination: expect.objectContaining({ key: "a+b+c" }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("a+b+c");
    expect(rows()[1]).toHaveClass("bx--viz-upset__row--selected");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
