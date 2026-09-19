import { fireEvent, render, screen } from "@testing-library/svelte";
import ToolbarSearchDebounce from "./ToolbarSearchDebounce.test.svelte";

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

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    expect(component.filteredRowIds).toHaveLength(6);

    await vi.advanceTimersByTimeAsync(300);

    expect(component.filteredRowIds).toHaveLength(1);
  });

  it("runs the filter once after the last of several rapid inputs", async () => {
    const { component } = render(ToolbarSearchDebounce, {
      props: { debounce: 300 },
    });
    const baseline = component.filterRowsCount;

    const input = screen.getByRole("searchbox") as HTMLInputElement;
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

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Balancer 1" } });
    expect(component.filteredRowIds).toHaveLength(6);

    await fireEvent.input(input, { target: { value: "" } });

    expect(component.filteredRowIds).toHaveLength(6);
  });

  // TODO(bun-migration): needs investigation under bun:test — see tests/bun/MIGRATION.md
  it.skip("does not throw or update state when unmounted with a pending run", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(ToolbarSearchDebounce, {
      props: { debounce: 300 },
    });

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Balancer 1" } });

    unmount();

    await expect(vi.advanceTimersByTimeAsync(300)).resolves.not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
