import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchExtraUpdates from "./ToolbarSearchExtraUpdates.test.svelte";

describe("ToolbarSearch does not refilter on unrelated updates", () => {
  it("only calls filterRows when value/rows/shouldFilterRows change", async () => {
    const onFilterRows = vi.fn();
    render(ToolbarSearchExtraUpdates, { props: { onFilterRows } });

    // Snapshot the call count after mount; we don't assert an exact mount
    // count since the initial filter may legitimately run during setup.
    expect(onFilterRows).toHaveBeenCalled();
    onFilterRows.mockClear();

    // Click a button that only bumps an unrelated reactive value (which
    // changes ToolbarSearch's `tabindex` prop). This should NOT trigger a
    // refilter; the search value, rows, and shouldFilterRows are unchanged.
    await user.click(screen.getByRole("button", { name: "Bump unrelated" }));
    expect(onFilterRows).not.toHaveBeenCalled();
  });
});
