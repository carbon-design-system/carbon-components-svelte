import { fireEvent, render, screen } from "@testing-library/svelte";
import ToolbarSearchDebounce from "./ToolbarSearchDebounce.test.svelte";
import ToolbarSearchDeferFilter from "./ToolbarSearchDeferFilter.test.svelte";

describe("ToolbarSearch debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays filtering until typing pauses", async () => {
    const { component } = render(ToolbarSearchDebounce, {
      props: { debounce: 300 },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(300);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("filters a starting value right away", () => {
    const { component } = render(ToolbarSearchDebounce, {
      props: { debounce: 300, value: "Balancer 1" },
    });

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("runs the filter once after the last of several rapid inputs", async () => {
    const { component } = render(ToolbarSearchDebounce, {
      props: { debounce: 300 },
    });
    const baseline = component.filterRowsCount;

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "B" } });
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.input(input, { target: { value: "Ba" } });
    await vi.advanceTimersByTimeAsync(300);

    expect(component.filterRowsCount).toBe(baseline + 1);
    expect(component.filteredRowIds).toHaveLength(6);
  });

  it("restores rows immediately on clear without advancing timers", async () => {
    const { component } = render(ToolbarSearchDebounce, {
      props: { debounce: 300 },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    await vi.advanceTimersByTimeAsync(300);
    expect(component.filteredRowIds).toHaveLength(1);

    await fireEvent.input(input, { target: { value: "" } });

    expect(component.filteredRowIds).toHaveLength(6);
  });

  it.each([
    ["a pending debounced run", ToolbarSearchDebounce, { debounce: 300 }, 300],
    ["a yielded filter", ToolbarSearchDeferFilter, { deferFilter: true }, 0],
  ])(
    "does not filter after unmount with %s",
    async (_, Fixture, props, wait) => {
      const onFilterRows = vi.fn();
      const { unmount } = render(Fixture, {
        props: { ...props, onFilterRows },
      });

      const input = screen.getByRole("searchbox");
      await fireEvent.input(input, { target: { value: "Balancer 1" } });
      unmount();
      const callsAtUnmount = onFilterRows.mock.calls.length;

      await vi.advanceTimersByTimeAsync(wait + 10);

      expect(onFilterRows).toHaveBeenCalledTimes(callsAtUnmount);
    },
  );
});
