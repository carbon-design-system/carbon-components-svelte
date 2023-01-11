<script>
  /**
   * @event {ReadonlyArray<File>} change
   */

  /**
   * Specify the accepted file types
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Obtain a reference to the uploaded files
   * @type {ReadonlyArray<File>}
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to disable label changes */
  export let disableLabelChanges = false;

  /**
   * Specify the kind of file uploader button
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger"}
   */
  export let kind = "primary";

  /** Specify the label text */
  export let labelText = "Add file";

  /** Specify the label role */
  export let role = "button";

  /** Specify `tabindex` attribute */
  export let tabindex = "0";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the input */
  export let name = "";

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let initialLabelText = labelText;

  $: if (ref && files.length === 0) {
    labelText = initialLabelText;
    ref.value = null;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<label
  aria-disabled="{disabled}"
  for="{id}"
  tabindex="{disabled ? '-1' : tabindex}"
  class:bx--btn="{true}"
  class:bx--btn--sm="{true}"
  class:bx--btn--disabled="{disabled}"
  class:bx--btn--primary="{kind === 'primary'}"
  class:bx--btn--secondary="{kind === 'secondary'}"
  class:bx--btn--tertiary="{kind === 'tertiary'}"
  class:bx--btn--ghost="{kind === 'ghost'}"
  class:bx--btn--danger="{kind === 'danger'}"
  on:keydown
  on:keydown="{({ key }) => {
    if (key === ' ' || key === 'Enter') {
      ref.click();
    }
  }}"
>
  <span role="{role}">
    <slot name="labelText">
      {labelText}
    </slot>
  </span>
</label>
<input
  bind:this="{ref}"
  type="file"
  tabindex="-1"
  accept="{accept}"
  disabled="{disabled}"
  id="{id}"
  multiple="{multiple}"
  name="{name}"
  class:bx--visually-hidden="{true}"
  {...$$restProps}
  on:change|stopPropagation="{({ target }) => {
    files = [...target.files];

    if (files && !disableLabelChanges) {
      labelText = files.length > 1 ? `${files.length} files` : files[0].name;
    }

    dispatch('change', files);
  }}"
  on:click
  on:click="{({ target }) => {
    target.value = null;
  }}"
/>
