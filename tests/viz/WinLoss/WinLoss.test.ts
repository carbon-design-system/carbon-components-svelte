import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import WinLoss from "./WinLoss.test.svelte";

describe("WinLoss", () => {
  it("names the image with the record and writes it short", () => {
    render(WinLoss);

    const root = screen.getByRole("img", {
      name: "Last 5 experiments: 3 wins, 1 loss, 1 tie",
    });
    expect(root).toBe(screen.getByTestId("basic"));
    expect(root.querySelector(".bx--viz-winloss__value")).toHaveTextContent(
      "3–1–1",
    );
  });

  it("gives each outcome its own class, so position never rests on color", () => {
    render(WinLoss);

    const marks = Array.from(
      screen.getByTestId("basic").querySelectorAll(".bx--viz-winloss__result"),
    );
    expect(marks.map((m) => m.className.match(/result--(\w+)/)?.[1])).toEqual([
      "win",
      "win",
      "loss",
      "tie",
      "win",
    ]);
    expect(
      within(screen.getByTestId("basic")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("is decorative without a label and writes no value by default", () => {
    render(WinLoss);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector(".bx--viz-winloss__value")).toBeNull();
  });

  it("selects a result by click and keyboard, with translated outcomes and no tie count when there is none", async () => {
    const onselect = vi.fn();
    render(WinLoss, { props: { onselect } });

    const group = screen.getByRole("group", {
      name: "Pick a day: 1 Sieg, 1 Niederlage, 1 Remis",
    });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Mon: Sieg",
      "Tue: Niederlage",
      "Wed: Remis",
    ]);
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, 0]);

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("1");
    expect(onselect).toHaveBeenCalledWith({
      result: { value: -2, label: "Tue" },
      index: 1,
    });

    await user.keyboard("{ArrowLeft}");
    expect(buttons[0]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("0");
  });
});
