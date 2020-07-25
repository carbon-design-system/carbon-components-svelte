<script>
  export let accept = [];
  export let multiple = false;
  export let disabled = false;
  export let disableLabelChanges = false;
  export let kind = "primary"; // Button.kind
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
</script>

<label
  aria-disabled={disabled}
  for={id}
  tabindex={disabled ? '-1' : tabindex}
  class:bx--btn={true}
  class:bx--btn--sm={true}
  class:bx--btn--disabled={disabled}
  class={kind && `bx--btn--${kind}`}
  on:keydown
  on:keydown={({ key }) => {
    if (key === ' ' || key === 'Enter') {
      ref.click();
    }
  }}>
  <span {role}>{labelText}</span>
</label>
<input
  bind:this={ref}
  type="file"
  tabindex="-1"
  {accept}
  {disabled}
  {id}
  {multiple}
  {name}
  class:bx--visually-hidden={true}
  {...$$restProps}
  on:change|stopPropagation
  on:change|stopPropagation={({ target }) => {
    const files = target.files;
    const length = files.length;
    if (files && !disableLabelChanges) {
      labelText = length > 1 ? `${length} files` : files[0].name;
    }
  }}
  on:click
  on:click={({ target }) => {
    target.value = null;
  }} />
