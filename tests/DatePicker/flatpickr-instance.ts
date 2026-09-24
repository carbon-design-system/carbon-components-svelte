import type { Instance } from "flatpickr/dist/types/instance";

/**
 * Returns the flatpickr `Instance` that flatpickr attaches to its `<input>`
 * element as `_flatpickr`, asserting that it has been initialized.
 */
export function getFlatpickrInstance(input: Element): Instance {
  const instance = (input as unknown as { _flatpickr?: Instance })._flatpickr;
  assert(
    instance,
    "expected the input to have an initialized flatpickr instance",
  );
  return instance;
}
