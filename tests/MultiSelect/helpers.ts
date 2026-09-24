import { screen } from "@testing-library/svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { user } from "../utils/user";

/** Trimmed text content of the currently rendered options, in DOM order. */
export function optionTexts() {
  return screen.queryAllByRole("option").map((el) => el.textContent?.trim());
}

/** Clicks the closed combobox trigger to open the menu. */
export async function openMenu() {
  await user.click(await screen.findByRole("combobox", { expanded: false }));
}

/** Sequential items numbered "Item 1", "Item 2", ... by a 0-based id. */
export function createItems(count: number): MultiSelectItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    text: `Item ${index + 1}`,
  }));
}

/** A small fixed set of contact-style items shared by the sort/reuse tests. */
export function buildItems(): MultiSelectItem[] {
  return [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Phone" },
    { id: "4", text: "Mail" },
  ];
}
