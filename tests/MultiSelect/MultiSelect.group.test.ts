import { render, screen, waitFor, within } from "@testing-library/svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import { createItems, optionTexts, toggleOption } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectGroupSlot from "./MultiSelectGroupSlot.test.svelte";

const regions: MultiSelectItem[] = [
  { id: "us-west-2", text: "US West (Oregon)", group: "Americas" },
  { id: "eu-west-1", text: "Europe (Ireland)", group: "Europe" },
  { id: "us-east-1", text: "US East (N. Virginia)", group: "Americas" },
  { id: "global", text: "Global edge network" },
  { id: "eu-central-1", text: "Europe (Frankfurt)", group: "Europe" },
];

function headerTexts() {
  return Array.from(
    document.querySelectorAll(".bx--list-box__menu-group-header"),
    (header) => header.textContent?.trim(),
  );
}

describe("MultiSelect grouped items", () => {
  it("renders a header per group, ungrouped items first and groups in items order", () => {
    render(MultiSelect, { props: { items: regions, open: true } });

    expect(headerTexts()).toEqual(["Americas", "Europe"]);
    // `sortItem` sorts within each group, never across groups.
    expect(optionTexts()).toEqual([
      "Global edge network",
      "US East (N. Virginia)",
      "US West (Oregon)",
      "Europe (Frankfurt)",
      "Europe (Ireland)",
    ]);
  });

  it("wraps each group's options in a group named by its label", () => {
    render(MultiSelect, { props: { items: regions, open: true } });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getAllByRole("group")).toHaveLength(2);
    within(listbox).getByRole("group", { name: "Americas" });
    const europe = within(listbox).getByRole("group", { name: "Europe" });
    expect(
      within(europe)
        .getAllByRole("option")
        .map((option) => option.textContent?.trim()),
    ).toEqual(["Europe (Frankfurt)", "Europe (Ireland)"]);

    // Ungrouped options stay direct children of the listbox, and the visible
    // headers are hidden in favor of the group names.
    expect(
      within(listbox).getByRole("option", { name: "Global edge network" })
        .parentElement,
    ).toBe(listbox);
    for (const header of document.querySelectorAll(
      ".bx--list-box__menu-group-header",
    )) {
      expect(header).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("moves selected items to the top of their own group", async () => {
    render(MultiSelect, {
      props: { items: regions, selectionFeedback: "top", open: true },
    });

    await toggleOption("US West (Oregon)");
    await toggleOption("Europe (Ireland)");

    expect(optionTexts()).toEqual([
      "Global edge network",
      "US West (Oregon)",
      "US East (N. Virginia)",
      "Europe (Ireland)",
      "Europe (Frankfurt)",
    ]);
  });

  it("drops the header of a group with no filter matches", async () => {
    render(MultiSelect, {
      props: { items: regions, filterable: true, labelText: "Regions" },
    });

    await user.type(screen.getByRole("combobox"), "europe");

    expect(headerTexts()).toEqual(["Europe"]);
    expect(optionTexts()).toEqual(["Europe (Frankfurt)", "Europe (Ireland)"]);
  });

  it("keeps select-all above the groups and toggles items in every group", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultiSelect, {
      props: {
        items: [
          { id: "all", text: "All regions", isSelectAll: true },
          ...regions,
        ],
        open: true,
      },
    });

    expect(optionTexts()[0]).toBe("All regions");
    await toggleOption("All regions");

    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        selectedIds: expect.arrayContaining(regions.map((item) => item.id)),
      }),
    );
  });

  it("passes the group label and its items to the group slot", () => {
    render(MultiSelectGroupSlot, {
      props: { items: regions, selectedIds: ["eu-west-1"] },
    });

    expect(headerTexts()).toEqual(["Americas: 0 of 2", "Europe: 1 of 2"]);
  });

  it("renders headers as measured rows in a virtualized list", async () => {
    const items = createItems(300).map((item, index) => ({
      ...item,
      group: index < 150 ? "Primary" : "Replica",
    }));
    render(MultiSelect, { props: { items, sortItem: false, open: true } });

    const header = document.querySelector(".bx--list-box__menu-group-header");
    assert(header);
    expect(header).toHaveTextContent("Primary");
    expect(header).toHaveAttribute("data-virtual-index", "0");

    // Positions and set size count options, not header rows.
    const [first] = screen.getAllByRole("option");
    expect(first).toHaveAttribute("data-virtual-index", "1");
    expect(first).toHaveAttribute("aria-posinset", "1");
    expect(first).toHaveAttribute("aria-setsize", "300");

    // A window that starts mid-group still names that group. Scroll after
    // the open-time scroll settles, or it resets the position.
    const listbox = screen.getByRole("listbox");
    await flushMacrotask();
    listbox.scrollTop = 100 * 40;
    listbox.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(
        document.querySelector(".bx--list-box__menu-group-header"),
      ).toBeNull();
    });
    const [firstOption] = screen.getAllByRole("option");
    const [group] = within(listbox).getAllByRole("group");
    expect(group).toContainElement(firstOption);
    expect(group).toHaveAccessibleName(
      Number(firstOption.getAttribute("aria-posinset")) <= 150
        ? "Primary"
        : "Replica",
    );
  });
});
