import { screen } from "@testing-library/svelte";

/** Returns the ComboBox's text input, narrowed for direct DOM property access. */
export function getInput() {
  const input = screen.getByRole("combobox");
  assert(input instanceof HTMLInputElement);
  return input;
}

/** Returns the button that clears the selection. */
export function getClearButton() {
  return screen.getByRole("button", { name: "Clear selected item" });
}
