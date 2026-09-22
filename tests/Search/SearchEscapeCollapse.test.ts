import { fireEvent, render, screen } from "@testing-library/svelte";
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
});
