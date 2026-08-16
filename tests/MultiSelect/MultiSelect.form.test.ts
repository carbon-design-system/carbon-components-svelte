import { render, screen } from "@testing-library/svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { user } from "../utils/user";
import MultiSelectForm from "./MultiSelect.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect native form serialization", () => {
  const getForm = () => screen.getByTestId("form") as HTMLFormElement;

  const openMenu = async () =>
    await user.click(await screen.findByRole("combobox", { expanded: false }));

  it("submits selected items while the menu is closed, keyed by item id by default", () => {
    render(MultiSelectForm, {
      props: { items, selectedIds: ["0", "1"] },
    });

    const formData = new FormData(getForm());
    expect(formData.has("0")).toBe(true);
    expect(formData.has("1")).toBe(true);
    expect(formData.has("2")).toBe(false);
  });

  it("uses a shared name and per-item value from itemToInput", () => {
    render(MultiSelectForm, {
      props: {
        items,
        selectedIds: ["0", "1"],
        itemToInput: (item: MultiSelectItem) => ({
          name: "contact",
          value: item.id,
        }),
      },
    });

    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["0", "1"]);
  });

  it("uses the `name` prop as the default group name when itemToInput does not override it", () => {
    render(MultiSelectForm, {
      props: { items, selectedIds: ["0", "1"], name: "items" },
    });

    const formData = new FormData(getForm());
    expect(formData.getAll("items")).toHaveLength(2);
    expect(formData.has("0")).toBe(false);
    expect(formData.has("1")).toBe(false);
  });

  it("does not duplicate entries when the menu is open", async () => {
    render(MultiSelectForm, {
      props: {
        items,
        selectedIds: ["0", "1"],
        itemToInput: (item: MultiSelectItem) => ({
          name: "contact",
          value: item.id,
        }),
      },
    });

    await openMenu();

    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["0", "1"]);
  });

  it("omits the isSelectAll item", () => {
    const itemsWithSelectAll = [
      { id: "select-all", text: "All roles", isSelectAll: true },
      { id: "editor", text: "Editor" },
      { id: "owner", text: "Owner" },
    ];

    render(MultiSelectForm, {
      props: {
        items: itemsWithSelectAll,
        selectedIds: ["select-all", "editor", "owner"],
      },
    });

    const formData = new FormData(getForm());
    expect(formData.has("select-all")).toBe(false);
    expect(formData.has("editor")).toBe(true);
    expect(formData.has("owner")).toBe(true);
  });

  it("omits disabled items even when selected", () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
    ];

    render(MultiSelectForm, {
      props: {
        items: itemsWithDisabled,
        selectedIds: ["0", "1"],
      },
    });

    const formData = new FormData(getForm());
    expect(formData.has("0")).toBe(true);
    expect(formData.has("1")).toBe(false);
  });

  it("contributes nothing to FormData when nothing is selected", () => {
    render(MultiSelectForm, { props: { items, selectedIds: [] } });

    const formData = new FormData(getForm());
    expect([...formData.keys()]).toEqual([]);
  });

  it("filterable: submits the selection while closed and never the filter query, even when `name` is set", async () => {
    render(MultiSelectForm, {
      props: {
        items,
        filterable: true,
        selectedIds: ["0"],
        name: "items",
      },
    });

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(input, "no-match-xyz");

    const formData = new FormData(getForm());
    expect(formData.getAll("items")).toHaveLength(1);
    expect([...formData.values()]).not.toContain("no-match-xyz");
  });

  it("filterable: honors itemToInput while closed", () => {
    render(MultiSelectForm, {
      props: {
        items,
        filterable: true,
        selectedIds: ["0", "1"],
        itemToInput: (item: MultiSelectItem) => ({
          name: "contact",
          value: item.id,
        }),
      },
    });

    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["0", "1"]);
  });

  it("virtualize: serializes the full selection while closed, beyond the viewport window", () => {
    const manyItems = Array.from({ length: 150 }, (_, index) => ({
      id: String(index),
      text: `Item ${index}`,
    }));

    render(MultiSelectForm, {
      props: {
        items: manyItems,
        virtualize: true,
        selectedIds: ["0", "149"],
      },
    });

    const formData = new FormData(getForm());
    expect(formData.has("0")).toBe(true);
    expect(formData.has("149")).toBe(true);
  });
});
