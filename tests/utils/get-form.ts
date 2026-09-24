import { screen } from "@testing-library/svelte";

/** Returns the fixture's `<form data-testid="form">`, narrowed to a form. */
export function getForm() {
  const form = screen.getByTestId("form");
  assert(form instanceof HTMLFormElement);
  return form;
}
