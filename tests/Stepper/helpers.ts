/** Counts the progress steps carrying the `current` or `complete` state class. */
export function stepsWith(state: "current" | "complete") {
  return document.querySelectorAll(`.bx--progress-step--${state}`).length;
}
