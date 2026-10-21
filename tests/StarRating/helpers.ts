import { fireEvent, screen } from "@testing-library/svelte";

/** Returns the radio input for the star with the given 1-based position. */
export function star(n: number, max = 5) {
  return screen.getByRole("radio", { name: `${n} out of ${max} stars` });
}

/** Fires a pointerenter on a star's label to preview it (a mouse by default). */
export function hover(n: number, pointerType = "mouse") {
  return fireEvent.pointerEnter(star(n).closest("label") as HTMLElement, {
    pointerType,
  });
}
