import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import TooltipGroup from "./TooltipGroup.test.svelte";
import TooltipGroupInline from "./TooltipGroupInline.test.svelte";

const texts = () =>
  openTooltips().map((tooltip) => tooltip.textContent?.trim());

async function setup(props = {}) {
  render(TooltipGroup, { props });
  await tick();
  await tick();
  return {
    edit: screen.getByRole("button", { name: "Edit" }),
    copy: screen.getByRole("button", { name: "Copy link" }),
    list: screen.getByRole("tab", { name: "List view" }),
    deleteButton: screen.getByRole("button", { name: "Delete" }),
  };
}

describe("TooltipGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders no element of its own", async () => {
    const { container } = render(TooltipGroup);
    await tick();
    expect(container.firstElementChild).toHaveClass("bx--btn");
  });

  it("hands off instantly between Button, CopyButton, and Switch in the group", async () => {
    const { edit, copy, list } = await setup();

    await fireEvent.mouseEnter(edit);
    expect(texts()).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);
    expect(texts()).toEqual(["Edit"]);

    await fireEvent.mouseLeave(edit);
    await fireEvent.mouseEnter(copy);
    await tick();
    expect(texts()).toEqual(["Copy link"]);

    await fireEvent.mouseLeave(copy);
    await fireEvent.mouseEnter(list);
    await tick();
    expect(texts()).toEqual(["List view"]);
  });

  it("waits for the enter delay when crossing the group boundary", async () => {
    const { edit, deleteButton } = await setup();

    await fireEvent.mouseEnter(edit);
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.mouseLeave(edit);
    await fireEvent.mouseEnter(deleteButton);
    await tick();
    // The group's tooltip hides as the pointer leaves; the outside one
    // has not opened yet.
    expect(texts()).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);
    expect(texts()).toEqual(["Delete"]);
  });

  it("hides an icon tooltip as soon as the pointer leaves", async () => {
    const { edit, list } = await setup();

    await fireEvent.mouseEnter(list);
    await vi.advanceTimersByTimeAsync(100);
    expect(texts()).toEqual(["List view"]);
    await fireEvent.mouseLeave(list);
    await tick();
    expect(texts()).toEqual([]);

    // The skip window still carries the handoff to a neighbor.
    await fireEvent.mouseEnter(edit);
    await tick();
    expect(texts()).toEqual(["Edit"]);
  });

  it("keeps an icon tooltip up for the group's `leaveDelayMs`", async () => {
    const { list } = await setup({ leaveDelayMs: 300 });

    await fireEvent.mouseEnter(list);
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.mouseLeave(list);
    await vi.advanceTimersByTimeAsync(299);
    expect(texts()).toEqual(["List view"]);
    await vi.advanceTimersByTimeAsync(1);
    expect(texts()).toEqual([]);
  });

  it("opens instantly within `skipDelayMs` after a group tooltip closes", async () => {
    const { edit, list } = await setup({ skipDelayMs: 500 });

    await fireEvent.mouseEnter(edit);
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.mouseLeave(edit);
    await tick();
    expect(texts()).toEqual([]);

    await vi.advanceTimersByTimeAsync(400);
    await fireEvent.mouseEnter(list);
    await tick();
    expect(texts()).toEqual(["List view"]);
  });

  it("waits for the enter delay once `skipDelayMs` has passed", async () => {
    const { edit, list } = await setup({ skipDelayMs: 0 });

    await fireEvent.mouseEnter(edit);
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.mouseLeave(edit);
    await vi.advanceTimersByTimeAsync(300);

    await fireEvent.mouseEnter(list);
    await tick();
    expect(texts()).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);
    expect(texts()).toEqual(["List view"]);
  });

  it("applies `enterDelayMs` to its members", async () => {
    const { list } = await setup({ enterDelayMs: 400 });

    await fireEvent.mouseEnter(list);
    await vi.advanceTimersByTimeAsync(399);
    expect(texts()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(texts()).toEqual(["List view"]);
  });

  it("marks inline tooltips opened by handoff so they skip the fade-in", async () => {
    render(TooltipGroupInline);
    await tick();

    const edit = screen.getByRole("button", { name: "Edit" });
    const del = screen.getByRole("button", { name: "Delete" });
    const icon = screen.getByRole("button", { name: "Synced" });

    // The first tooltip fades in as usual.
    await fireEvent.mouseEnter(edit);
    expect(edit).not.toHaveClass("bx--tooltip--instant");

    await fireEvent.mouseLeave(edit);
    await fireEvent.mouseEnter(del);
    expect(del).toHaveClass("bx--tooltip--instant");
    expect(edit).not.toHaveClass("bx--tooltip--instant");

    await fireEvent.mouseLeave(del);
    await fireEvent.mouseEnter(icon);
    expect(icon).toHaveClass("bx--tooltip--instant");
    expect(del).not.toHaveClass("bx--tooltip--instant");

    // Past the skip window, the next tooltip fades in again.
    await fireEvent.mouseLeave(icon);
    await vi.advanceTimersByTimeAsync(600);
    await fireEvent.mouseEnter(edit);
    expect(edit).not.toHaveClass("bx--tooltip--instant");
  });

  it("focus shows an inline tooltip without the fade and hides a hovered one", async () => {
    render(TooltipGroupInline);
    await tick();

    const edit = screen.getByRole("button", { name: "Edit" });
    const del = screen.getByRole("button", { name: "Delete" });
    const icon = screen.getByRole("button", { name: "Synced" });

    // First focus, nothing open before it: still no fade.
    await fireEvent.focus(edit);
    expect(edit).toHaveClass("bx--tooltip--instant");

    // Tabbing on hands the slot over.
    await fireEvent.blur(edit);
    await fireEvent.focus(icon);
    expect(icon).toHaveClass("bx--tooltip--instant");
    expect(icon).toHaveClass("bx--tooltip--visible");
    expect(edit).not.toHaveClass("bx--tooltip--instant");

    // Hovering another button hides the focused one's tooltip.
    await fireEvent.mouseEnter(del);
    expect(icon).toHaveClass("bx--tooltip--hidden");
    expect(del).not.toHaveClass("bx--tooltip--hidden");
  });

  it("keeps a focused inline Button holding the slot after the pointer leaves", async () => {
    render(TooltipGroupInline);
    await tick();

    const edit = screen.getByRole("button", { name: "Edit" });

    await fireEvent.focus(edit);
    await fireEvent.mouseEnter(edit);
    await fireEvent.mouseLeave(edit);
    // `instant` only holds while the Button has the slot.
    expect(edit).toHaveClass("bx--tooltip--instant");

    await fireEvent.blur(edit);
    expect(edit).not.toHaveClass("bx--tooltip--instant");
  });
});
