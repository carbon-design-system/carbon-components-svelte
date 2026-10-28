import { screen } from "@testing-library/svelte";
import { user } from "../utils/user";

/** The trimmed names of the rendered tree items, in DOM order. */
export function treeItemNames() {
  return screen
    .queryAllByRole("treeitem")
    .map((item) => item.textContent?.trim());
}

/** Focuses the combobox and opens it with the keyboard. */
export async function openWithKeyboard() {
  const field = screen.getByRole("combobox");
  field.focus();
  await user.keyboard("{ArrowDown}");
  return field;
}
