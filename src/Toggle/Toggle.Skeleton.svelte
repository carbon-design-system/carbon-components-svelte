<script>
  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <input
    type="checkbox"
    id="{id}"
    class:bx--toggle="{true}"
    class:bx--skeleton="{true}" />
  <label
    aria-label="{labelText ? undefined : $$props['aria-label'] || 'Toggle is loading'}"
    for="{id}"
    class:bx--toggle__label="{true}"
    class:bx--skeleton="{true}">
    {#if labelText}
      <span class:bx--toggle__label-text="{true}">{labelText}</span>
    {/if}
    <span class:bx--toggle__text--left="{true}"></span>
    <span class:bx--toggle__appearance="{true}"></span>
    <span class:bx--toggle__text--right="{true}"></span>
  </label>
</div>
