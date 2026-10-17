import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";
import { getInput } from "./helpers";

// Shared windowing behavior is in tests/ListBox/family/virtualize.test.ts.
describe("ComboBox virtualization", () => {
  it("windows the filtered list", async () => {
    render(ComboBox, {
      props: {
        items: Array.from({ length: 500 }, (_, i) => ({
          id: String(i),
          text: `Item ${i + 1}`,
          price: i * 10,
        })),
        virtualize: true,
        shouldFilterItem: (item: { text: string }, value: string) =>
          item.text.toLowerCase().includes(value.toLowerCase()),
      },
    });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Item 1");

    // "Item 1" matches Item 1, Items 10-19 and Items 100-199: 111 options,
    // of which the window renders ceil(300 / 40) + 3.
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(11);
    options.forEach((option, i) => {
      expect(option.textContent).toMatch(/Item 1/i);
      expect(option).toHaveAttribute("aria-setsize", "111");
      expect(option).toHaveAttribute("aria-posinset", String(i + 1));
    });
  });
});
