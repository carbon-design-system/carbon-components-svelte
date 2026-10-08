import { render, screen, within } from "@testing-library/svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { user } from "../utils/user";
import ComboBoxGroup from "./ComboBoxGroup.test.svelte";

const regions: ComboBoxItem<string>[] = [
  { id: "us-west-2", text: "US West (Oregon)", group: "Americas" },
  { id: "eu-west-1", text: "Europe (Ireland)", group: "Europe" },
  { id: "us-east-1", text: "US East (N. Virginia)", group: "Americas" },
  { id: "global", text: "Global edge network" },
];

function headerTexts() {
  return Array.from(
    document.querySelectorAll(".bx--list-box__menu-group-header"),
    (header) => header.textContent?.trim(),
  );
}

function optionTexts() {
  return screen
    .queryAllByRole("option")
    .map((option) => option.textContent?.trim());
}

describe("ComboBox grouped items", () => {
  it("renders headers in order of first appearance, ungrouped items first", () => {
    render(ComboBoxGroup, { props: { items: regions, open: true } });

    expect(headerTexts()).toEqual(["Americas (2)", "Europe (1)"]);
    expect(optionTexts()).toEqual([
      "Global edge network",
      "US West (Oregon)",
      "US East (N. Virginia)",
      "Europe (Ireland)",
    ]);
  });

  it("wraps each group's options in a group named by its label", () => {
    render(ComboBoxGroup, { props: { items: regions, open: true } });

    const listbox = screen.getByRole("listbox");
    const americas = within(listbox).getByRole("group", { name: "Americas" });
    expect(within(americas).getAllByRole("option")).toHaveLength(2);
    within(listbox).getByRole("group", { name: "Europe" });
  });

  it("skips headers with the arrow keys", async () => {
    render(ComboBoxGroup, { props: { items: regions } });

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}");

    const highlighted = document.getElementById(
      input.getAttribute("aria-activedescendant") ?? "",
    );
    expect(highlighted).toHaveTextContent("US West (Oregon)");
  });

  it("stays open when a group header is clicked", async () => {
    render(ComboBoxGroup, { props: { items: regions } });

    await user.click(screen.getByRole("combobox"));
    const header = document.querySelector(".bx--list-box__menu-group-header");
    assert(header);
    await user.click(header);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it.each(["remove", "hide"] as const)(
    "drops a group with no filter matches (filterMode: %s)",
    async (filterMode) => {
      render(ComboBoxGroup, {
        props: { items: regions, typeahead: true, filterMode },
      });

      await user.type(screen.getByRole("combobox"), "eu");

      expect(headerTexts()).toEqual(["Europe (1)"]);
      expect(optionTexts()).toEqual(["Europe (Ireland)"]);
    },
  );
});
