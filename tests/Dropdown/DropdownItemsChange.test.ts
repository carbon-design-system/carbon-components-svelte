import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DropdownItemsChange from "./DropdownItemsChange.test.svelte";

function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    text: `Item ${i + 1}`,
  }));
}

describe("Dropdown items change while open", () => {
  it("does not throw and leaves selection unchanged when Enter is pressed after items shrink past the highlighted index", async () => {
    const onSelect = vi.fn();
    const onError = vi.fn();
    window.addEventListener("error", onError);

    const { rerender } = render(DropdownItemsChange, {
      props: {
        items: createItems(10),
        open: false,
        onSelect,
      },
    });

    const trigger = screen.getByRole("combobox");
    await fireEvent.click(trigger);

    for (let i = 0; i < 6; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential execution is intentional
      await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    }
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      expect.stringContaining("-5"),
    );

    await rerender({ items: createItems(3), open: true, onSelect });
    await tick();

    await fireEvent.keyDown(trigger, { key: "Enter" });
    await tick();

    window.removeEventListener("error", onError);

    expect(onError).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
