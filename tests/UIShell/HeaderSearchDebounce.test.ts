import { fireEvent, render, screen } from "@testing-library/svelte";
import HeaderSearchDebounce from "./HeaderSearchDebounce.test.svelte";
import HeaderSearchMenu from "./HeaderSearchMenu.test.svelte";

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

      const input = screen.getByRole("textbox");
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
  });

  describe("menu slot mode", () => {
    it("dispatches search once after the pause", async () => {
      const onSearch = vi.fn();
      render(HeaderSearchMenu, { props: { debounce: 200, onSearch } });

      const input = screen.getByRole("combobox");
      await fireEvent.input(input, { target: { value: "no-match-here" } });
      expect(input).toHaveValue("no-match-here");

      await vi.advanceTimersByTimeAsync(199);
      expect(onSearch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("no-match-here");
    });
  });

  describe("cancels a pending debounce", () => {
    const cases: {
      name: string;
      Fixture: typeof HeaderSearchDebounce | typeof HeaderSearchMenu;
      role: "textbox" | "combobox";
      typed: string;
      act: (input: HTMLElement) => Promise<unknown>;
      clearsValue?: boolean;
    }[] = [
      {
        name: "results: clear-button click",
        Fixture: HeaderSearchDebounce,
        role: "textbox",
        typed: "res",
        act: () =>
          fireEvent.click(screen.getByRole("button", { name: "Clear" })),
      },
      {
        name: "results: Escape (non-empty value)",
        Fixture: HeaderSearchDebounce,
        role: "textbox",
        typed: "res",
        act: (input) => fireEvent.keyDown(input, { key: "Escape" }),
        clearsValue: true,
      },
      {
        name: "results: Enter selects a result",
        Fixture: HeaderSearchDebounce,
        role: "textbox",
        typed: "res",
        act: (input) => fireEvent.keyDown(input, { key: "Enter" }),
      },
      {
        name: "menu: Enter selects the active item",
        Fixture: HeaderSearchMenu,
        role: "combobox",
        typed: "Data",
        act: async (input) => {
          await fireEvent.keyDown(input, { key: "ArrowDown" });
          await fireEvent.keyDown(input, { key: "Enter" });
        },
        // Confirms the active-item branch ran (not the free-text submit branch).
        clearsValue: true,
      },
      {
        name: "menu: Enter submits free text",
        Fixture: HeaderSearchMenu,
        role: "combobox",
        typed: "no-match-here",
        act: (input) => fireEvent.keyDown(input, { key: "Enter" }),
      },
      {
        name: "menu: clear-button click",
        Fixture: HeaderSearchMenu,
        role: "combobox",
        typed: "no-match-here",
        act: () =>
          fireEvent.click(
            screen.getByRole("button", { name: "Clear search input" }),
          ),
      },
    ];

    it.each(cases)(
      "on $name",
      async ({ Fixture, role, typed, act, clearsValue }) => {
        const onSearch = vi.fn();
        render(Fixture, { props: { debounce: 200, onSearch } });

        const input = screen.getByRole(role);
        await fireEvent.input(input, { target: { value: typed } });
        await act(input);
        if (clearsValue) expect(input).toHaveValue("");

        await vi.advanceTimersByTimeAsync(200);
        expect(onSearch).not.toHaveBeenCalled();
      },
    );
  });
});
