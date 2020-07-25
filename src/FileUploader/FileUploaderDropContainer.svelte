<script>
  export let accept = [];
  export let disabled = false;
  export let multiple = false;
  export let validateFiles = files => files;
  export let labelText = "Add file";
  export let role = "button";
  export let tabindex = "0";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let name = "";
  export let ref = null;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  $: over = false;
</script>

<div
  class:bx--file={true}
  {...$$restProps}
  on:dragover
  on:dragover|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = true;
      dataTransfer.dropEffect = 'copy';
    }
  }}
  on:dragleave
  on:dragleave|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dataTransfer.dropEffect = 'move';
    }
  }}
  on:drop
  on:drop|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dispatch('add', validateFiles(dataTransfer.files));
    }
  }}>
  <label
    for={id}
    {tabindex}
    class:bx--file-browse-btn={true}
    class:bx--file-browse-btn--disabled={disabled}
    on:keydown
    on:keydown={({ key }) => {
      if (key === ' ' || key === 'Enter') {
        ref.click();
      }
    }}>
    <div
      {role}
      class:bx--file__drop-container={true}
      class:bx--file__drop-container--drag-over={over}>
      {labelText}
      <input
        bind:this={ref}
        type="file"
        tabindex="-1"
        {id}
        {disabled}
        {accept}
        {name}
        {multiple}
        class:bx--file-input={true}
        on:change
        on:change={({ target }) => {
          dispatch('add', validateFiles(target.files));
        }}
        on:click
        on:click={({ target }) => {
          target.value = null;
        }} />
    </div>
  </label>
</div>
