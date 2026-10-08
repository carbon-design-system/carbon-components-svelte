import { render, screen, within } from "@testing-library/svelte";
import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.test.svelte";
import DropdownGroupSlot from "./DropdownGroupSlot.test.svelte";
import { createItems } from "./helpers";

const regions: DropdownItem<string>[] = [
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
    .getAllByRole("option")
    .map((option) => option.textContent?.trim());
}

describe("Dropdown grouped items", () => {
  it("renders headers in order of first appearance, ungrouped items first", () => {
    render(Dropdown, { props: { items: regions, open: true } });

    expect(headerTexts()).toEqual(["Americas", "Europe"]);
    expect(optionTexts()).toEqual([
      "Global edge network",
      "US West (Oregon)",
      "US East (N. Virginia)",
      "Europe (Ireland)",
    ]);
  });

  it("wraps each group's options in a group named by its label", () => {
    render(Dropdown, { props: { items: regions, open: true } });

    const listbox = screen.getByRole("listbox");
    const americas = within(listbox).getByRole("group", { name: "Americas" });
    expect(within(americas).getAllByRole("option")).toHaveLength(2);
    within(listbox).getByRole("group", { name: "Europe" });
    for (const header of document.querySelectorAll(
      ".bx--list-box__menu-group-header",
    )) {
      expect(header).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("skips headers and follows the grouped order with the arrow keys", async () => {
    render(Dropdown, { props: { items: regions } });

    const field = screen.getByRole("combobox");
    field.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    const highlighted = document.getElementById(
      field.getAttribute("aria-activedescendant") ?? "",
    );
    expect(highlighted).toHaveTextContent("US East (N. Virginia)");

    await user.keyboard("{Enter}");
    expect(field).toHaveTextContent("US East (N. Virginia)");
  });

  it("stays open when a group header is clicked", async () => {
    render(Dropdown, { props: { items: regions, open: true } });

    const header = document.querySelector(".bx--list-box__menu-group-header");
    assert(header);
    await user.click(header);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("passes the group label and its items to the group slot", () => {
    render(DropdownGroupSlot, { props: { items: regions } });

    expect(headerTexts()).toEqual(["Americas (2)", "Europe (1)"]);
  });

  it("renders headers as measured rows in a virtualized list", () => {
    const items = createItems(300).map((item, index) => ({
      ...item,
      group: index < 150 ? "Primary" : "Replica",
    }));
    render(Dropdown, { props: { items, open: true } });

    const header = document.querySelector(".bx--list-box__menu-group-header");
    expect(header).toHaveTextContent("Primary");
    expect(header).toHaveAttribute("data-virtual-index", "0");

    // Positions and set size count options, not header rows.
    const [first] = screen.getAllByRole("option");
    expect(first).toHaveAttribute("data-virtual-index", "1");
    expect(first).toHaveAttribute("aria-posinset", "1");
    expect(first).toHaveAttribute("aria-setsize", "300");
  });
});
