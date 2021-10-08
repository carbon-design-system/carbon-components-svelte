<script>
  /**
   * @deprecated
   * This component will be removed in version 1.0.0.
   * Use `<ToggleSkeleton size="sm" />` instead
   */

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    id="{id}"
    class:bx--toggle="{true}"
    class:bx--toggle--small="{true}"
    class:bx--skeleton="{true}"
  />
  <label
    aria-label="{labelText
      ? undefined
      : $$props['aria-label'] || 'Toggle is loading'}"
    class:bx--toggle__label="{true}"
    class:bx--skeleton="{true}"
    for="{id}"
  >
    {#if labelText}
      <span class:bx--toggle__label-text="{true}">{labelText}</span>
    {/if}
    <span class:bx--toggle__appearance="{true}">
      <svg
        class:bx--toggle__check="{true}"
        width="6"
        height="5"
        viewBox="0 0 6 5"
      >
        <path
          d="M2.2403 2.7299L4.9245 0 6 1.1117 2.2384 5 0 2.6863 1.0612 1.511z"
        ></path>
      </svg>
    </span>
  </label>
</div>
