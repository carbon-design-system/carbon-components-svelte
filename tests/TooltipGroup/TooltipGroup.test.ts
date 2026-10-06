import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import TooltipGroup from "./TooltipGroup.test.svelte";

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
});
