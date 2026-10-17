import { fireEvent, render, screen } from "@testing-library/svelte";
import ToolbarSearchTiming from "./ToolbarSearchTiming.test.svelte";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToolbarSearch debounce", () => {
  it("delays filtering until typing pauses", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { debounce: 300 },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(300);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("filters a starting value right away", () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { debounce: 300, value: "Balancer 1" },
    });

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("runs the filter once after the last of several rapid inputs", async () => {
    const onFilterRows = vi.fn();
    const { component } = render(ToolbarSearchTiming, {
      props: { debounce: 300, onFilterRows },
    });
    onFilterRows.mockClear();

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "B" } });
    await vi.advanceTimersByTimeAsync(100);
    await fireEvent.input(input, { target: { value: "Ba" } });
    await vi.advanceTimersByTimeAsync(300);

    expect(onFilterRows).toHaveBeenCalledTimes(1);
    expect(component.filteredRowIds).toHaveLength(6);
  });

  it("restores rows immediately on clear without advancing timers", async () => {
    const { component } = render(ToolbarSearchTiming, {
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
    ["a pending debounced run", { debounce: 300 }, 300],
    ["a yielded filter", { deferFilter: true }, 0],
  ])("does not filter after unmount with %s", async (_, props, wait) => {
    const onFilterRows = vi.fn();
    const { unmount } = render(ToolbarSearchTiming, {
      props: { ...props, onFilterRows },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    unmount();
    const callsAtUnmount = onFilterRows.mock.calls.length;

    await vi.advanceTimersByTimeAsync(wait + 10);

    expect(onFilterRows).toHaveBeenCalledTimes(callsAtUnmount);
  });
});

describe("ToolbarSearch deferFilter", () => {
  it("updates value at once and filters after yielding", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: true },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.value).toBe("Balancer 1");
    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("defers clearing", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: true },
    });
    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    await vi.advanceTimersByTimeAsync(0);
    expect(component.filteredRowIds).toHaveLength(1);

    await fireEvent.input(input, { target: { value: "" } });

    expect(component.value).toBe("");
    expect(component.filteredRowIds).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toHaveLength(6);
  });

  it("filters only the latest value after rapid input", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: true },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 2" } });
    await fireEvent.input(input, { target: { value: "Balancer 3" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toEqual([3]);

    await fireEvent.input(input, { target: { value: "Balancer 4" } });
    await fireEvent.input(input, { target: { value: "" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toHaveLength(6);
  });

  it("debounces first, then yields", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: true, debounce: 300 },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    await vi.advanceTimersByTimeAsync(299);
    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(1);
    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(5);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("uses scheduler.yield when available", async () => {
    const yieldMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal("scheduler", { yield: yieldMock });
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: true },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(yieldMock).toHaveBeenCalled();
    expect(component.filteredRowIds).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it("filters synchronously when deferFilter is false", async () => {
    const { component } = render(ToolbarSearchTiming, {
      props: { deferFilter: false },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.filteredRowIds).toHaveLength(1);
  });
});
