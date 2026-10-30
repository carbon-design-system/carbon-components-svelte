import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Kanban from "./Kanban.test.svelte";

const handle = (name: string) => screen.getByRole("button", { name });
const layout = () =>
  [...document.querySelectorAll<HTMLElement>("[data-kanban-column]")]
    .map(
      (column) =>
        `${column.dataset.kanbanColumn}:${[
          ...column.querySelectorAll<HTMLElement>("[data-kanban-item]"),
        ]
          .map((item) => item.dataset.kanbanItem)
          .join("")}`,
    )
    .join(" ");
const live = () => screen.getByRole("status").textContent?.trim();

describe("Kanban", () => {
  it("names columns and lists cards, with one tab stop", () => {
    render(Kanban);
    const list = within(
      screen
        .getByRole("heading", { name: /To do/ })
        .closest("[data-kanban-column]") as HTMLElement,
    ).getByRole("list");
    expect(list).toHaveAccessibleName(/To do/);
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const stops = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("tabindex") === "0");
    // The first card's handle. Its menu opens with Shift+F10.
    expect(stops).toEqual([handle("Alpha")]);
  });

  it("adds and removes collapse buttons when collapsible changes", async () => {
    const { rerender } = render(Kanban, { collapsible: false });
    const toggles = () =>
      screen.queryAllByRole("button", { name: /^Collapse/ });
    expect(toggles()).toHaveLength(0);
    await rerender({ collapsible: true });
    expect(toggles()).toHaveLength(3);
    await rerender({ collapsible: false });
    expect(toggles()).toHaveLength(0);
  });

  it("announces moves politely", () => {
    render(Kanban);
    // Moves are status, not errors that block the user.
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("moves a card with the keyboard and fires a cancelable move once, on drop", async () => {
    const onMove = vi.fn();
    render(Kanban, { onMove });
    handle("Bravo").focus();
    await user.keyboard(" ");
    expect(live()).toContain("Bravo picked up. Position 2 of 2 in To do");
    await user.keyboard("{ArrowRight}");
    expect(live()).toBe("Doing, position 2 of 2.");
    expect(onMove).not.toHaveBeenCalled();
    expect(layout()).toBe("todo:ab doing:c done:d");
    await user.keyboard("{ArrowUp}");
    expect(live()).toBe("Doing, position 1 of 2.");
    await user.keyboard("{Enter}");
    expect(onMove).toHaveBeenCalledExactlyOnceWith({
      id: "b",
      from: "todo",
      to: "doing",
      index: 0,
      fromIndex: 1,
      source: "keyboard",
    });
    await tick();
    expect(layout()).toBe("todo:a doing:bc done:d");
    expect(live()).toContain("Bravo dropped. Position 1 of 2 in Doing");
    expect(live()).toContain("Doing is over its limit: 2 of 1");
  });

  it("Escape puts the card back and fires nothing", async () => {
    const onMove = vi.fn();
    render(Kanban, { onMove });
    handle("Alpha").focus();
    await user.keyboard(" {ArrowRight}{ArrowRight}{Escape}");
    expect(live()).toContain("Move cancelled");
    expect(onMove).not.toHaveBeenCalled();
    expect(layout()).toBe("todo:ab doing:c done:d");
  });

  it("leaves a refused move where it was", async () => {
    render(Kanban, { refuse: true });
    handle("Alpha").focus();
    await user.keyboard(" {ArrowRight}{Enter}");
    await tick();
    expect(layout()).toBe("todo:ab doing:c done:d");
    expect(live()).toContain("Move cancelled");
  });

  it("assigns a new items array only when bound", async () => {
    const { unmount } = render(Kanban, { bound: true });
    handle("Alpha").focus();
    await user.keyboard(" {ArrowRight}{Enter}");
    await tick();
    expect(screen.getByTestId("consumer")).toHaveTextContent(
      "todo:b doing:ac done:d",
    );
    unmount();

    render(Kanban, { bound: false });
    handle("Alpha").focus();
    await user.keyboard(" {ArrowRight}{Enter}");
    await tick();
    // The board shows the move; the consumer's array is untouched.
    expect(layout()).toBe("todo:b doing:ac done:d");
    expect(screen.getByTestId("consumer")).toHaveTextContent(
      "todo:ab doing:c done:d",
    );
  });

  it("blocks a full column in block mode, from the keyboard and the menu", async () => {
    render(Kanban, { limitMode: "block" });
    handle("Alpha").focus();
    await user.keyboard(" {ArrowRight}");
    expect(live()).toBe("Doing is full. Its limit is 1.");
    await user.keyboard("{Enter}");
    expect(layout()).toBe("todo:ab doing:c done:d");

    handle("Alpha").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(
      await screen.findByRole("menuitem", { name: "Move to Doing" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("menuitem", { name: "Move to Done" }),
    ).toBeEnabled();
  });

  it("moves a card from its menu and puts focus on it afterwards", async () => {
    render(Kanban);
    await user.click(screen.getByRole("button", { name: "Move Alpha" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Move to Done" }),
    );
    await tick();
    expect(layout()).toBe("todo:b doing:c done:da");
    expect(live()).toContain("Alpha dropped. Position 2 of 2 in Done");
    expect(handle("Alpha")).toHaveFocus();
  });

  it("walks focus with arrow keys and hands the tab stop to the card", async () => {
    render(Kanban);
    handle("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(handle("Bravo")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(handle("Charlie")).toHaveFocus();
    expect(handle("Charlie")).toHaveAttribute("tabindex", "0");
    expect(handle("Alpha")).toHaveAttribute("tabindex", "-1");
  });

  it("collapses a column, skips it by keyboard, and keeps its count", async () => {
    render(Kanban, { collapsible: true });
    await user.click(screen.getByRole("button", { name: "Collapse Doing" }));
    expect(screen.getByTestId("collapsed")).toHaveTextContent("doing");
    expect(
      screen.getByRole("button", { name: "Expand Doing" }),
    ).toHaveAttribute("aria-expanded", "false");
    handle("Alpha").focus();
    await user.keyboard("{ArrowRight}");
    expect(handle("Delta")).toHaveFocus();
  });

  it("marks a column over its limit with text, not just color", () => {
    render(Kanban);
    expect(screen.getByText("1 of 1 cards")).toBeInTheDocument();
  });

  it("does not pick cards up when disabled", async () => {
    render(Kanban, { disabled: true });
    handle("Alpha").focus();
    await user.keyboard(" ");
    expect(live()).toBe("");
  });
});
