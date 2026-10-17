import { flushFormReset } from "./flush-form-reset";
import { getForm } from "./get-form";

/**
 * Resets the fixture's `<form data-testid="form">`, then waits for
 * `use:formReset` to write the restored values back to their bindings.
 */
export async function resetForm() {
  getForm().reset();
  await flushFormReset();
}
