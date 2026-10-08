<script>
  /**
   * Constraint-validation proxy for a list box whose value lives in hidden
   * inputs, which the browser never validates. A required text input that is
   * empty when nothing is selected, so a wrapping `<form>` blocks submit.
   * Kept out of the tab order and the accessibility tree. The browser's error
   * bubble is cancelled; the owner shows its invalid state on `invalid`
   * instead, and clears it on `reset`.
   * @event {null} invalid
   * @event {null} reset
   */

  /** Set to `true` when the list box has a selection */
  export let hasValue = false;

  /** Set to `true` to bar the proxy from validation, as a disabled field is */
  export let disabled = false;

  /** Set to `true` to bar the proxy from validation, as a read-only field is */
  export let readonly = false;

  /**
   * The element focused when the browser reports the error.
   * @type {null | HTMLElement}
   */
  export let focusTarget = null;

  import { createEventDispatcher } from "svelte";
  import { formReset } from "../utils/form-reset.js";
  import { handleRequiredInvalid } from "./list-box-utils.js";

  const dispatch = createEventDispatcher();
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
  use:formReset={() => dispatch("reset")}
  on:invalid={(event) => {
    handleRequiredInvalid(event, focusTarget);
    dispatch("invalid");
  }}
>
