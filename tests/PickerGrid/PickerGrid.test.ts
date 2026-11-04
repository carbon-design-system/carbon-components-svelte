import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import PickerGrid from "./PickerGrid.test.svelte";

const names = () =>
  screen
    .getAllByRole("option")
    .map((option) => option.getAttribute("aria-label"));

describe("PickerGrid", () => {
  it("groups the options by category and names each group", () => {
    render(PickerGrid);
    expect(screen.getByRole("group", { name: "Fruit" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Vegetables" }),
    ).toBeInTheDocument();
    expect(names()).toEqual(["Apple", "Banana", "Carrot", "Leek"]);
    expect(screen.getByRole("option", { name: "Leek" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("gives each option its place in the whole set", () => {
    render(PickerGrid);
    const carrot = screen.getByRole("option", { name: "Carrot" });
    expect(carrot).toHaveAttribute("aria-posinset", "3");
    expect(carrot).toHaveAttribute("aria-setsize", "4");
  });

  it("chooses on click, dispatches select and keeps the option first in recent", async () => {
    render(PickerGrid, { recent: ["carrot"] });
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(screen.getByTestId("selected")).toHaveTextContent("banana");
    expect(screen.getByTestId("recent")).toHaveTextContent("banana,carrot");
    expect(screen.getByTestId("events")).toHaveTextContent("banana:true");
    expect(
      screen.getAllByRole("option", { name: "Banana", selected: true }),
    ).not.toHaveLength(0);
  });

  it("does not choose a disabled option", async () => {
    render(PickerGrid);
    await user.click(screen.getByRole("option", { name: "Leek" }));
    expect(screen.getByTestId("selected")).toHaveTextContent("");
    expect(screen.getByTestId("recent")).toHaveTextContent("");
  });

  it("toggles in multiple selection", async () => {
    render(PickerGrid, { selectionMode: "multiple" });
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await user.click(screen.getByRole("option", { name: "Apple" }));
    await user.click(screen.getByRole("option", { name: "Carrot" }));
    expect(screen.getByTestId("selected-ids")).toHaveTextContent(
      "apple,carrot",
    );
    await user.click(screen.getByRole("option", { name: "Apple" }));
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("carrot");
  });

  it("filters by label and keyword, and shows the noResults slot", async () => {
    render(PickerGrid);
    await user.type(screen.getByRole("combobox"), "yellow");
    expect(names()).toEqual(["Banana"]);
    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByTestId("none")).toHaveTextContent("Nothing for zzz");
    expect(screen.getByRole("listbox", { hidden: true })).not.toBeVisible();
  });

  it("names the highlighted option with aria-activedescendant and moves it with the arrows", async () => {
    render(PickerGrid);
    const search = screen.getByRole("combobox");
    await user.click(search);
    const id = () => search.getAttribute("aria-activedescendant");
    expect(document.getElementById(id() as string)).toHaveAttribute(
      "aria-label",
      "Apple",
    );
    await user.keyboard("{ArrowRight}");
    expect(document.getElementById(id() as string)).toHaveAttribute(
      "aria-label",
      "Banana",
    );
    // Two columns: down from Banana (column 1) lands on column 1 of the next
    // section's row, and focus stays in the search field.
    await user.keyboard("{ArrowDown}");
    expect(search).toHaveFocus();
    expect(document.getElementById(id() as string)).toHaveAttribute(
      "aria-label",
      "Leek",
    );
    // Leek is disabled, so Enter chooses nothing.
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });

  it("takes the tab stop when there is no search, and jumps by typing", async () => {
    render(PickerGrid, { searchable: false });
    const list = screen.getByRole("listbox");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(list).toHaveAttribute("tabindex", "0");
    list.focus();
    await user.keyboard("c");
    const id = list.getAttribute("aria-activedescendant") as string;
    expect(document.getElementById(id)).toHaveAttribute("aria-label", "Carrot");
  });

  it("skips an id in recent or selected that no item holds", () => {
    render(PickerGrid, { recent: ["gone", "apple"], selectedId: "missing" });
    expect(screen.getByRole("group", { name: "Recent" })).toBeInTheDocument();
    expect(
      screen
        .getByRole("group", { name: "Recent" })
        .querySelectorAll("[role=option]"),
    ).toHaveLength(1);
  });
});
