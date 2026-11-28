import { act, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SelectionBar from "./SelectionBar.test.svelte";
import SelectionBarConditionalItems from "./SelectionBarConditionalItems.test.svelte";
import SelectionBarPlain from "./SelectionBarPlain.test.svelte";

// What the page's shared live region holds.
const spoken = () =>
  document.querySelector("[data-announcer] [role=status]")?.textContent ?? "";
const advance = async (ms: number) => {
  await act(() => vi.advanceTimersByTimeAsync(ms));
};

describe("SelectionBar", () => {
  it("shows the count, the actions, the items and the clear button while something is selected", () => {
    render(SelectionBar);
    const bar = screen.getByRole("region", { name: "2 selected" });
    expect(bar).toHaveTextContent("2 selected");
    expect(bar).toContainElement(
      screen.getByRole("button", { name: "Download" }),
    );
    expect(bar).toContainElement(screen.getByText("Billing"));
    const buttons = screen
      .getAllByRole("button")
      .filter((button) => bar.contains(button));
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "Download",
      "Clear selection",
    ]);
  });

  it("renders nothing at zero", async () => {
    const { rerender } = render(SelectionBar, { count: 0 });
    expect(screen.queryByTestId("bar")).toBeNull();
    await rerender({ count: 1 });
    expect(screen.getByRole("region", { name: "1 selected" })).toBeVisible();
  });

  it("renders no items row without the slot", () => {
    const { container } = render(SelectionBarPlain);
    expect(container.querySelector(".bx--selection-bar__bar")).not.toBeNull();
    expect(container.querySelector(".bx--selection-bar__items")).toBeNull();
  });

  // The stylesheet hides an `:empty` row: no elements and no text, which
  // jsdom's `:empty` misreads for the zero-length text Svelte leaves.
  it("leaves the items row empty while the slot renders nothing", async () => {
    const { container, rerender } = render(SelectionBarConditionalItems);
    const row = container.querySelector(".bx--selection-bar__items");
    expect(row?.children).toHaveLength(0);
    expect(row?.textContent).toBe("");
    await rerender({ showNotice: true });
    expect(row?.children).toHaveLength(1);
  });

  it("tells the app to clear, with the count it cleared", async () => {
    const onClear = vi.fn();
    render(SelectionBar, { onClear });
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onClear).toHaveBeenCalledWith({ count: 2 });
    expect(screen.queryByTestId("bar")).toBeNull();
  });

  it("returns focus to where it came from when clearing hides the bar", async () => {
    render(SelectionBar);
    screen.getByTestId("before").focus();
    await user.tab();
    await user.tab();
    const clear = screen.getByRole("button", { name: "Clear selection" });
    expect(clear).toHaveFocus();
    await user.keyboard("{Enter}");
    await act(() => Promise.resolve());
    expect(screen.getByTestId("before")).toHaveFocus();
  });

  it("focuses returnFocusTo instead when it is set", async () => {
    render(SelectionBar, {
      returnFocusTo: () => screen.getByTestId("fallback"),
    });
    screen.getByTestId("before").focus();
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    await act(() => Promise.resolve());
    expect(screen.getByTestId("fallback")).toHaveFocus();
  });

  // Delete removes the row, and its checkbox, that focus came from.
  it.each([
    ["leaves focus alone", false, () => document.body],
    ["focuses returnFocusTo", true, () => screen.getByTestId("fallback")],
  ])(
    "%s when an action removes where focus came from",
    async (_, set, focused) => {
      render(SelectionBar, {
        downloadDeletes: true,
        returnFocusTo: set ? () => screen.getByTestId("fallback") : null,
      });
      screen.getByTestId("before").focus();
      await user.tab();
      await user.keyboard("{Enter}");
      await act(() => Promise.resolve());
      expect(screen.queryByTestId("before")).toBeNull();
      expect(screen.queryByTestId("bar")).toBeNull();
      expect(focused()).toHaveFocus();
    },
  );

  it("uses selectedText for the text, the name and the announcement", async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(SelectionBar, {
        selectedText: (count: number) => `${count} of 9 services`,
      });
      expect(
        screen.getByRole("region", { name: "2 of 9 services" }),
      ).toHaveTextContent("2 of 9 services");
      await rerender({ count: 3 });
      await advance(1000);
      expect(spoken()).toBe("3 of 9 services");
    } finally {
      vi.useRealTimers();
    }
  });

  it("announces the count once the selection settles, not on the first render", async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(SelectionBar, { count: 1 });
      await advance(1000);
      expect(spoken()).toBe("");

      await rerender({ count: 2 });
      await advance(100);
      await rerender({ count: 3 });
      await advance(100);
      await rerender({ count: 4 });
      await advance(400);
      expect(spoken()).toBe("");
      await advance(200);
      expect(spoken()).toBe("4 selected");

      await rerender({ count: 0 });
      await advance(600);
      expect(spoken()).toBe("0 selected");
    } finally {
      vi.useRealTimers();
    }
  });

  it("is named by a consumer aria-label instead of its count", () => {
    render(SelectionBar, { label: "Selected services" });
    const bar = screen.getByRole("region", { name: "Selected services" });
    expect(bar).not.toHaveAttribute("aria-labelledby");
  });

  it.each([
    ["content", false],
    ["viewport-end", true],
  ] as const)("places a %s bar", (placement, pinned) => {
    render(SelectionBar, { placement });
    expect(
      screen
        .getByTestId("bar")
        .classList.contains("bx--selection-bar--viewport-end"),
    ).toBe(pinned);
  });
});
