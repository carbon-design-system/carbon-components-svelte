import { screen, within } from "@testing-library/svelte";

/** The "Clear filter" close button of the tag labelled `label`. */
export function closeButtonOf(label: string) {
  const tag = screen.getByText(label).closest(".bx--tag") as HTMLElement;
  return within(tag).getByTitle("Clear filter");
}
