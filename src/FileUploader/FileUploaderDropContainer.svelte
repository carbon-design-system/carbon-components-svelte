<script>
  /**
   * Specify the accepted file types
   * @type {string[]} [accept=[]]
   */
  export let accept = [];

  /**
   * Set to `true` to allow multiple files
   * @type {boolean} [multiple=false]
   */
  export let multiple = false;

  /**
   * Override the default behavior of validating uploaded files
   * The default behavior does not validate files
   * @type {(files: Files) => Files} [validateFiles = (files: Files) => Files]
   */
  export let validateFiles = (files) => files;

  /**
   * Specify the label text
   * @type {string} [labelText="Add file"]
   */
  export let labelText = "Add file";

  /**
   * Specify the `role` attribute of the drop container
   * @type {string} [role="button"]
   */
  export let role = "button";

  /**
   * Set to `true` to disable the input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify `tabindex` attribute
   * @type {string} [tabindex="0"]
   */
  export let tabindex = "0";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name=""]
   */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

  /**
   * @typedef {string[]} Files
   */

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  $: over = false;
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
  }}">
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
    }}">
    <div
      role="{role}"
      class:bx--file__drop-container="{true}"
      class:bx--file__drop-container--drag-over="{over}">
      {labelText}
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
        }}" />
    </div>
  </label>
</div>
