import { tick } from "svelte";
import { getForm } from "./get-form";
import { user } from "./user";

/**
 * Clicks a submit button in `form`, as a user submitting it would, so
 * required fields show their invalid state. Calling `checkValidity()` or
 * `reportValidity()` from code doesn't. Waits for the deferred focus on
 * the first invalid field.
 */
export async function attemptSubmit(form = getForm()) {
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Submit";
  form.append(button);
  const preventSubmit = (event: Event) => event.preventDefault();
  form.addEventListener("submit", preventSubmit);
  await user.click(button);
  await tick();
  await new Promise((resolve) => setTimeout(resolve));
  form.removeEventListener("submit", preventSubmit);
  button.remove();
}
