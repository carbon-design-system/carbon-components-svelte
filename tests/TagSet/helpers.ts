import { screen, within } from "@testing-library/svelte";

const CLOSE_BUTTON_NAME = /^Clear filter/;

/** The "Clear filter" close button of the tag labelled `label`. */
export function closeButtonOf(label: string) {
  const tag = screen.getByText(label).closest(".bx--tag") as HTMLElement;
  return within(tag).getByRole("button", { name: CLOSE_BUTTON_NAME });
}
