import { fireEvent, render, screen } from "@testing-library/svelte";
import SearchMenuDebounce from "./SearchMenuDebounce.test.svelte";

describe("SearchMenu debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches search once after the pause, with the value updated immediately", async () => {
    const onSearch = vi.fn();
    render(SearchMenuDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "no-match-here" } });
    expect(input).toHaveValue("no-match-here");

    await vi.advanceTimersByTimeAsync(199);
    expect(onSearch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("no-match-here");
  });

  it("does not dispatch search on input when debounce is 0 (default)", async () => {
    const onSearch = vi.fn();
    render(SearchMenuDebounce, { props: { onSearch } });

    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "no-match-here" } });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("cancels a pending debounce on clear-button click instead of firing search with the stale value", async () => {
    const onSearch = vi.fn();
    render(SearchMenuDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "no-match-here" } });
    await fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("cancels a pending debounce when Enter selects the active item, without also firing search", async () => {
    const onSearch = vi.fn();
    render(SearchMenuDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "Data" } });
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "Enter" });

    // Confirms the active-item branch ran (not the free-text submit branch).
    expect(input).toHaveValue("Databases for TestSQL");

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("cancels a pending debounce when Enter submits free text, without also firing search", async () => {
    const onSearch = vi.fn();
    render(SearchMenuDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "no-match-here" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
