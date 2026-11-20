import { screen } from "@testing-library/svelte";
import { user } from "../utils/user";

/** The trimmed names of the rendered tree items, in DOM order. */
export function treeItemNames() {
  return screen.queryAllByRole("treeitem").map((item) => {
    const labelId = item.getAttribute("aria-labelledby");
    const label = labelId ? document.getElementById(labelId) : item;
    return label?.textContent?.trim();
  });
}

/** The names of the items in one column, by its group's name. */
export function columnNames(name: string) {
  const group = screen.getByRole("group", { name });
  return [...group.querySelectorAll('[role="treeitem"]')].map((item) =>
    document
      .getElementById(item.getAttribute("aria-labelledby") ?? "")
      ?.textContent?.trim(),
  );
}

/** Focuses the combobox and opens it with the keyboard. */
export async function openWithKeyboard() {
  const field = screen.getByRole("combobox");
  field.focus();
  await user.keyboard("{ArrowDown}");
  return field;
}
