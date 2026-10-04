import { render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { tick } from "svelte";
import { createItems } from "../Dropdown/helpers";
import { user } from "../utils/user";

type Item = ReturnType<typeof createItems>[number];

const variants: [string, (items: Item[]) => void][] = [
  [
    "Dropdown",
    (items) => render(Dropdown, { props: { items, labelText: "Items" } }),
  ],
  [
    "ComboBox",
    (items) => render(ComboBox, { props: { items, labelText: "Items" } }),
  ],
  [
    "MultiSelect",
    (items) =>
      render(MultiSelect, {
        props: { items, labelText: "Items", sortItem: false },
      }),
  ],
  [
    "MultiSelect (filterable)",
    (items) =>
      render(MultiSelect, {
        props: { items, labelText: "Items", sortItem: false, filterable: true },
      }),
  ],
];

async function press(key: string) {
  await user.keyboard(key);
  await tick();
}

function activeDescendant() {
  return screen.getByRole("combobox").getAttribute("aria-activedescendant");
}

describe.each(variants)("%s PageUp/PageDown", (_name, setup) => {
  it("moves the highlight 10 options and stops at either end", async () => {
    setup(createItems(25));
    screen.getByRole("combobox").focus();

    await press("{ArrowDown}");
    await press("{Home}");
    expect(activeDescendant()).toMatch(/-0$/);

    await press("{PageDown}");
    expect(activeDescendant()).toMatch(/-10$/);
    await press("{PageDown}");
    expect(activeDescendant()).toMatch(/-20$/);
    await press("{PageDown}");
    expect(activeDescendant()).toMatch(/-24$/);

    await press("{PageUp}");
    expect(activeDescendant()).toMatch(/-14$/);
    await press("{PageUp}");
    expect(activeDescendant()).toMatch(/-4$/);
    await press("{PageUp}");
    expect(activeDescendant()).toMatch(/-0$/);
  });

  it("leaves a closed menu closed", async () => {
    setup(createItems(25));
    const field = screen.getByRole("combobox");
    field.focus();

    await press("{PageDown}");

    expect(field).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the option it moves to in a virtualized menu", async () => {
    setup(createItems(150));
    screen.getByRole("combobox").focus();

    await press("{ArrowDown}");
    await press("{Home}");
    // Five PageDown presses.
    await press("{PageDown>5/}");

    const activeId = activeDescendant();
    expect(activeId).toMatch(/-50$/);
    await vi.waitFor(() => {
      expect(document.getElementById(activeId ?? "")).toBeInTheDocument();
    });
  });
});
