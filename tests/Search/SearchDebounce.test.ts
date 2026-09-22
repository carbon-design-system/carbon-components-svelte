import { fireEvent, render, screen } from "@testing-library/svelte";
import SearchDebounce from "./SearchDebounce.test.svelte";

describe("Search debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches search once after the pause, with the value updated immediately", async () => {
    const onSearch = vi.fn();
    render(SearchDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "a" } });
    expect(input).toHaveValue("a");
    await vi.advanceTimersByTimeAsync(50);

    await fireEvent.input(input, { target: { value: "ab" } });
    expect(input).toHaveValue("ab");

    await vi.advanceTimersByTimeAsync(199);
    expect(onSearch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("ab");
  });

  it("dispatches search immediately on Enter and does not fire again when the pending delay elapses", async () => {
    const onSearch = vi.fn();
    render(SearchDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "cloud" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("cloud");

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch search on input when debounce is 0 (default)", async () => {
    const onSearch = vi.fn();
    render(SearchDebounce, { props: { onSearch } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "test" } });
    await vi.advanceTimersByTimeAsync(1000);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("cancels a pending debounce on Escape instead of firing search with the stale value", async () => {
    const onSearch = vi.fn();
    render(SearchDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "cloud" } });
    await fireEvent.keyDown(input, { key: "Escape" });

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("cancels a pending debounce on clear-button click instead of firing search with the stale value", async () => {
    const onSearch = vi.fn();
    render(SearchDebounce, { props: { debounce: 200, onSearch } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "cloud" } });
    await fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await vi.advanceTimersByTimeAsync(200);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
