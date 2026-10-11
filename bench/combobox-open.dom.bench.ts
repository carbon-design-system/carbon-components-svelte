import { fireEvent, render } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { task } from "ostia";
import { tick } from "svelte";

// Open and close cost of a ComboBox with 5,000 items. Instances are rendered
// ONCE; the timed closure only opens and closes the menu, so it measures the
// per-open work (filter pass, option-index map, window resolution, mounting the
// visible options) and not component setup. The virtualized open should stay
// flat in item count. (An unvirtualized
// 5,000-option open takes seconds under the DOM shim, so it is not benched.)
function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

const items5000 = buildItems(5000);

const getInput = (container: HTMLElement) => {
  const input = container.querySelector("input");
  if (!input) throw new Error("combobox input not found");
  return input;
};

const registerOpenCase = (
  title: string,
  props: Record<string, unknown>,
): void => {
  const { container } = render(ComboBox, {
    props: { items: items5000, placeholder: "Options", ...props },
  });
  const input = getInput(container);

  task(title, async () => {
    await fireEvent.click(input);
    await tick();
    await fireEvent.keyDown(input, { key: "Escape" });
    await tick();
  });
};

registerOpenCase("open + close ComboBox, 5000 items (virtualized default)", {});
registerOpenCase("open + close ComboBox, 5000 items, typeahead", {
  typeahead: true,
});
registerOpenCase(
  "open + close ComboBox, 5000 items, selected item (virtualized)",
  { selectedId: "4321" },
);
