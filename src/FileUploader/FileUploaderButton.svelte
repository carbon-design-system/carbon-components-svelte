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
   * Set to `true` to disable the input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Set to `true` to disable label changes
   * @type {boolean} [disableLabelChanges=false]
   */
  export let disableLabelChanges = false;

  /**
   * Specify the kind of file uploader button
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger"} [kind="primary"]
   */
  export let kind = "primary";

  /**
   * Specify the label text
   * @type {string} [labelText="Add file"]
   */
  export let labelText = "Add file";

  /**
   * Specify the label role
   * @type {string} [role="button"]
   */
  export let role = "button";

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
   * @type {string} [name]
   */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
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
