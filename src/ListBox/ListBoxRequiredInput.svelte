<script>
  /**
   * Constraint-validation proxy for a list box whose value lives in hidden
   * inputs, which the browser never validates. A required text input that is
   * empty when nothing is selected, so a wrapping `<form>` blocks submit.
   * Kept out of the tab order and the accessibility tree; when the browser
   * focuses it to report the error, focus moves on to `focusTarget`.
   */

  /** Set to `true` when the list box has a selection */
  export let hasValue = false;

  /** Set to `true` to bar the proxy from validation, as a disabled field is */
  export let disabled = false;

  /** Set to `true` to bar the proxy from validation, as a read-only field is */
  export let readonly = false;

  /**
   * The element that receives focus when the browser reports the error.
   * @type {null | HTMLElement}
   */
  export let focusTarget = null;
</script>

<input
  type="text"
  class:bx--visually-hidden={true}
  tabindex="-1"
  aria-hidden="true"
  autocomplete="off"
  required
  value={hasValue ? "selected" : ""}
  {disabled}
  {readonly}
  on:focus={() => focusTarget?.focus()}
>
