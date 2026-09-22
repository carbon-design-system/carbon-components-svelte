import { fireEvent, render, screen } from "@testing-library/svelte";
import HeaderSearchDebounce from "./HeaderSearchDebounce.test.svelte";
import HeaderSearchMenuDebounce from "./HeaderSearchMenuDebounce.test.svelte";

describe("HeaderSearch debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("results mode", () => {
    it("dispatches search once after the pause, with the value updated immediately", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "res" } });
      expect(input).toHaveValue("res");

      await vi.advanceTimersByTimeAsync(199);
      expect(onSearch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("res");
    });

    it("does not dispatch search on input when debounce is 0 (default)", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchDebounce, { props: { onSearch } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "res" } });

      await vi.advanceTimersByTimeAsync(1000);
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("cancels a pending debounce on clear-button click", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "res" } });
      await fireEvent.click(screen.getByRole("button", { name: "Clear" }));

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("cancels a pending debounce on Escape (non-empty value)", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "res" } });
      await fireEvent.keyDown(input, { key: "Escape" });
      expect(input).toHaveValue("");

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("cancels a pending debounce when Enter selects a result", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "res" } });
      await fireEvent.keyDown(input, { key: "Enter" });

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe("menu slot mode", () => {
    it("dispatches search once after the pause", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchMenuDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("combobox") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "no-match-here" } });
      expect(input).toHaveValue("no-match-here");

      await vi.advanceTimersByTimeAsync(199);
      expect(onSearch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("no-match-here");
    });

    it("cancels a pending debounce when Enter selects the active item", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchMenuDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("combobox") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Data" } });
      await fireEvent.keyDown(input, { key: "ArrowDown" });
      await fireEvent.keyDown(input, { key: "Enter" });

      // Confirms the active-item branch ran (not the free-text submit branch).
      expect(input).toHaveValue("");

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("cancels a pending debounce when Enter submits free text", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchMenuDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("combobox");
      await fireEvent.input(input, { target: { value: "no-match-here" } });
      await fireEvent.keyDown(input, { key: "Enter" });

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("cancels a pending debounce on clear-button click", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchMenuDebounce, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("combobox");
      await fireEvent.input(input, { target: { value: "no-match-here" } });
      await fireEvent.click(screen.getByRole("button", { name: "Clear" }));

      await vi.advanceTimersByTimeAsync(200);
      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
