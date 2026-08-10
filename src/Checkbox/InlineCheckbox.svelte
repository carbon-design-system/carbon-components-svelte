<script>
  import { uniqueId } from "../utils/uniqueId.js";

  /** Specify whether the checkbox is checked */
  export let checked = false;

  /** Specify whether the checkbox is indeterminate */
  export let indeterminate = false;

  /**
   * Specify the title attribute for the label element.
   * @type {string}
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = uniqueId();

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  // Firefox treats shift+click on a `<label for="...">` as a text-selection gesture and
  // never forwards a click to the associated checkbox (no click, no change, no toggle):
  // https://bugzilla.mozilla.org/show_bug.cgi?id=559506. Detect that case on the label and
  // redispatch a click on the input directly so `on:click` sees consistent behavior,
  // including `shiftKey`, across browsers. Dispatching "click" on a checkbox runs its native
  // pre-click activation (toggle + a follow-up "change"), so do not also toggle `checked`
  // here or the browser's activation will immediately undo it (a double-toggle).
  function handleLabelClick(event) {
    if (!event.shiftKey || !ref || ref.disabled) return;
    event.preventDefault();
    ref.dispatchEvent(
      new MouseEvent("click", {
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  }
</script>

<div class:bx--checkbox--inline={true}>
  <input
    bind:this={ref}
    type="checkbox"
    class:bx--checkbox={true}
    checked={indeterminate ? false : checked}
    bind:indeterminate
    {id}
    {...$$restProps}
    aria-checked={indeterminate ? undefined : checked}
    on:click
    on:change
    on:focus
    on:blur
  >
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <label
    for={id}
    {title}
    aria-label={$$props["aria-label"]}
    class:bx--checkbox-label={true}
    on:click={handleLabelClick}
  ></label>
</div>
