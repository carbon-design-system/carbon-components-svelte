<script>
  /**
   * Specify the toggle size
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    id="{id}"
    class:cds--toggle="{true}"
    class:cds--toggle--small="{size === 'sm'}"
    class:cds--skeleton="{true}"
  />
  <label
    aria-label="{labelText
      ? undefined
      : $$props['aria-label'] || 'Toggle is loading'}"
    for="{id}"
    class:cds--toggle__label="{true}"
    class:cds--skeleton="{true}"
  >
    {#if labelText || $$slots.labelText}
      <span class:cds--toggle__label-text="{true}">
        <slot name="labelText">
          {labelText}
        </slot>
      </span>
    {/if}
    <span class:cds--toggle__text--left="{true}"></span>
    <span class:cds--toggle__appearance="{true}"></span>
    <span class:cds--toggle__text--right="{true}"></span>
  </label>
</div>
