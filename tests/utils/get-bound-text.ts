import { screen } from "@testing-library/svelte";

/**
 * Reads the text content of the `data-testid="bound"` element that
 * `*.form.test.svelte` fixtures render to mirror a component's bound value.
 */
export function getBoundText(testId = "bound") {
  return screen.getByTestId(testId).textContent;
}
