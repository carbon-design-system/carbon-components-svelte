<script>
  /**
   * @event {FileList} add
   */

  /**
   * Specify the accepted file types
   * @type {string[]}
   */
  export let accept = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Override the default behavior of validating uploaded files
   * The default behavior does not validate files
   * @type {(files: FileList) => FileList}
   */
  export let validateFiles = (files) => files;

  /** Specify the label text */
  export let labelText = "Add file";

  /** Specify the `role` attribute of the drop container */
  export let role = "button";

  /** Set to `true` to disable the input */
  export let disabled = false;

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

  let over = false;
</script>

<div
  class:bx--file="{true}"
  {...$$restProps}
  on:dragover
  on:dragover|preventDefault|stopPropagation="{({ dataTransfer }) => {
    if (!disabled) {
      over = true;
      dataTransfer.dropEffect = 'copy';
    }
  }}"
  on:dragleave
  on:dragleave|preventDefault|stopPropagation="{({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dataTransfer.dropEffect = 'move';
    }
  }}"
  on:drop
  on:drop|preventDefault|stopPropagation="{({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dispatch('add', validateFiles(dataTransfer.files));
    }
  }}"
>
  <label
    for="{id}"
    tabindex="{tabindex}"
    class:bx--file-browse-btn="{true}"
    class:bx--file-browse-btn--disabled="{disabled}"
    on:keydown
    on:keydown="{({ key }) => {
      if (key === ' ' || key === 'Enter') {
        ref.click();
      }
    }}"
  >
    <div
      role="{role}"
      class:bx--file__drop-container="{true}"
      class:bx--file__drop-container--drag-over="{over}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </div>
    <input
      bind:this="{ref}"
      type="file"
      tabindex="-1"
      id="{id}"
      disabled="{disabled}"
      accept="{accept}"
      name="{name}"
      multiple="{multiple}"
      class:bx--file-input="{true}"
      on:change
      on:change="{({ target }) => {
        dispatch('add', validateFiles(target.files));
      }}"
      on:click
      on:click="{({ target }) => {
        target.value = null;
      }}"
    />
  </label>
</div>
