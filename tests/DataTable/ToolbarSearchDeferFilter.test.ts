import { fireEvent, render, screen } from "@testing-library/svelte";
import ToolbarSearchDeferFilter from "./ToolbarSearchDeferFilter.test.svelte";

describe("ToolbarSearch deferFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates value at once and filters after yielding", async () => {
    const { component } = render(ToolbarSearchDeferFilter);
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.value).toBe("Balancer 1");
    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("defers clearing", async () => {
    const { component } = render(ToolbarSearchDeferFilter);
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
    const { component } = render(ToolbarSearchDeferFilter);
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 2" } });
    await fireEvent.input(input, { target: { value: "Balancer 3" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toEqual([3]);
  });

  it("does not let a yielded filter overwrite a newer value", async () => {
    const { component } = render(ToolbarSearchDeferFilter);
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 2" } });
    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.input(input, { target: { value: "Balancer 4" } });
    await fireEvent.input(input, { target: { value: "" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(component.filteredRowIds).toHaveLength(6);
  });

  it("debounces first, then yields", async () => {
    const { component } = render(ToolbarSearchDeferFilter, {
      props: { debounce: 300 },
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
    const { component } = render(ToolbarSearchDeferFilter);
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    await vi.advanceTimersByTimeAsync(0);

    expect(yieldMock).toHaveBeenCalled();
    expect(component.filteredRowIds).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it("filters synchronously when deferFilter is false", async () => {
    const { component } = render(ToolbarSearchDeferFilter, {
      props: { deferFilter: false },
    });
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.filteredRowIds).toHaveLength(1);
  });
});
