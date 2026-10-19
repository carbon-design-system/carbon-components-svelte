import { within } from "@testing-library/svelte";

/** Text content of every `<option>` in a select. */
export function optionTexts(select: HTMLElement) {
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent?.trim());
}
