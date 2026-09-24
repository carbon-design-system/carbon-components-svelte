import { screen } from "@testing-library/svelte";

/** Returns every segment `<input>` in DOM order, narrowed to inputs. */
export function getPinCodeInputs() {
  return screen.getAllByRole("textbox").map((input) => {
    assert(input instanceof HTMLInputElement);
    return input;
  });
}
