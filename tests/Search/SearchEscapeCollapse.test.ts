import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import SearchEscapeCollapse from "./SearchEscapeCollapse.test.svelte";

describe("Search Escape key", () => {
  it("clears a non-empty value on the first Escape, then collapses on the next", async () => {
    const onClear = vi.fn();

    render(SearchEscapeCollapse, {
      props: { expanded: true, value: "a", onClear },
    });

    const input = screen.getByRole("searchbox");
    const search = screen.getByRole("search");
    input.focus();

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(search).toHaveClass("bx--search--expanded");

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(search).not.toHaveClass("bx--search--expanded");
  });

  it("moves focus to the magnifier button when Escape collapses it", async () => {
    render(SearchEscapeCollapse, { props: { expanded: true } });

    const input = screen.getByRole("searchbox");
    input.focus();

    await fireEvent.keyDown(input, { key: "Escape" });
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it("does not dispatch clear on Escape when the non-expandable field is already empty", async () => {
    const onClear = vi.fn();

    render(SearchEscapeCollapse, {
      props: { expandable: false, expanded: false, value: "", onClear },
    });

    const input = screen.getByRole("searchbox");
    input.focus();

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(onClear).not.toHaveBeenCalled();
  });

  it.each([
    { key: "Escape", isComposing: true },
    { key: "Escape", keyCode: 229 },
  ])(
    "keeps the value when Escape cancels an IME composition (%o)",
    async (init) => {
      const onClear = vi.fn();

      render(SearchEscapeCollapse, {
        props: { expanded: true, value: "a", onClear },
      });

      const input = screen.getByRole("searchbox");
      input.focus();

      await fireEvent.keyDown(input, init);
      expect(input).toHaveValue("a");
      expect(onClear).not.toHaveBeenCalled();
      expect(screen.getByRole("search")).toHaveClass("bx--search--expanded");
    },
  );
});
