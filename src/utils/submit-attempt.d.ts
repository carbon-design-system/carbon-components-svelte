/**
 * Whether `form` is being submitted by a submit button or Enter right now,
 * as opposed to validated from code with `checkValidity()`. Only reports
 * attempts while at least one `submitAttempts` action is mounted.
 */
export function isSubmitAttempt(
  form: HTMLFormElement | null | undefined,
): boolean;

/**
 * Svelte action: track submit attempts while `enabled`, for
 * `isSubmitAttempt`. All instances share one pair of window listeners.
 */
export function submitAttempts(
  node: HTMLElement,
  enabled?: boolean,
): {
  update: (enabled?: boolean) => void;
  destroy: () => void;
};
