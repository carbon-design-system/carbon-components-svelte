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
   * @type {import("../Button/Button.svelte").ButtonProps["kind"]}
   */
  export let kind = "primary";

  /**
   * Specify the size of the file uploader button
   * @type {import("../Button/Button.svelte").ButtonProps["size"]}
   */
  export let size = "small";

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
    ref.value = "";
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<label
  aria-disabled="{disabled}"
  for="{id}"
  tabindex="{disabled ? '-1' : tabindex}"
  class:cds--btn="{true}"
  class:cds--btn--disabled="{disabled}"
  class:cds--btn--primary="{kind === 'primary'}"
  class:cds--btn--secondary="{kind === 'secondary'}"
  class:cds--btn--tertiary="{kind === 'tertiary'}"
  class:cds--btn--ghost="{kind === 'ghost'}"
  class:cds--btn--danger="{kind === 'danger'}"
  class:cds--btn--danger-tertiary="{kind === 'danger-tertiary'}"
  class:cds--btn--danger-ghost="{kind === 'danger-ghost'}"
  class:cds--btn--sm="{size === 'small'}"
  class:cds--btn--field="{size === 'field'}"
  class:cds--btn--lg="{size === 'lg'}"
  class:cds--btn--xl="{size === 'xl'}"
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
  class:cds--visually-hidden="{true}"
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
