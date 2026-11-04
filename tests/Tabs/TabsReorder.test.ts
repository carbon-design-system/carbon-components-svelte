import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TabsReorder from "./TabsReorder.test.svelte";

const names = () =>
  screen.getAllByRole("tab").map((tab) => tab.textContent?.trim());

const MOVE_RIGHT = "{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}";

describe("Tabs reorderable", () => {
  it("moves nothing and fires nothing without `reorderable`", async () => {
    const onReorder = vi.fn();
    render(TabsReorder, { props: { reorderable: false, onReorder } });
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);

    expect(onReorder).not.toHaveBeenCalled();
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation")).not.toHaveClass(
      "bx--tabs--reorderable",
    );
  });

  it("dispatches a reorder with the new index when a tab is moved by key", async () => {
    const onReorder = vi.fn();
    render(TabsReorder, { props: { onReorder } });
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);

    expect(onReorder).toHaveBeenCalledWith({
      id: "a",
      label: "Alpha",
      oldIndex: 0,
      newIndex: 1,
      source: "keyboard",
    });
    expect(names()).toEqual(["Bravo", "Alpha", "Charlie"]);
  });

  it("keeps focus on the moved tab and announces its new place", async () => {
    render(TabsReorder);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    alpha.focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Moved Alpha to position 2 of 3",
    );
  });

  it("announces a repeated message again, as two tabs can share a label", async () => {
    render(TabsReorder, { props: { labels: ["Doc", "Doc", "Doc"] } });
    screen.getAllByRole("tab")[0].focus();
    await user.keyboard(MOVE_RIGHT);
    await tick();
    const first = screen.getByRole("status").textContent;

    screen.getAllByRole("tab")[0].focus();
    await user.keyboard(MOVE_RIGHT);
    await tick();

    const second = screen.getByRole("status").textContent;
    expect(first?.trim()).toBe("Moved Doc to position 2 of 3");
    expect(second?.trim()).toBe(first?.trim());
    expect(second).not.toBe(first);
  });

  it("leaves the tabs, and the live region, alone when the app moves nothing", async () => {
    const onReorder = vi.fn();
    render(TabsReorder, { props: { applyMove: false, onReorder } });
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("is cancelable", async () => {
    const onReorder = vi.fn();
    render(TabsReorder, { props: { refuse: true, onReorder } });
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps the selected tab selected as it moves", async () => {
    render(TabsReorder);
    screen.getByRole("tab", { name: "Bravo" }).focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(names()).toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("points each tab at the hint, after the description it already names", () => {
    render(TabsReorder);
    const alpha = screen.getByRole("tab", { name: "Alpha" });

    const ids = alpha.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids[0]).toBe("own-note");
    expect(document.getElementById(ids[1])).toHaveTextContent(
      "Hold Control or Command and Shift",
    );
  });

  it("leaves the hint out when its text is empty", () => {
    render(TabsReorder, { props: { reorderHintText: "" } });

    expect(
      screen
        .getByRole("tab", { name: "Alpha" })
        .getAttribute("aria-describedby"),
    ).toBe("own-note");
  });
});
