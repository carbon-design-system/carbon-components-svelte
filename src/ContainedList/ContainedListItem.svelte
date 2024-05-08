<script>
  // @ts-check

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /** Set to `true` to disable the list item. */
  export let disabled = false;

  /**
   * Specify the icon to render
   * Icon is rendered to the left of the label text
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  $: tag = interactive ? "button" : "div";
  $: props = {
    type: interactive ? "button" : undefined,
    disabled: interactive ? disabled : undefined,
  };
</script>

<li
  class:bx--contained-list-item="{true}"
  class:bx--contained-list-item--clickable="{interactive}"
  class:bx--contained-list-item--with-icon="{icon}"
  class:bx--contained-list-item--with-action="{$$slots.action}"
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svelte:element
    this="{tag}"
    {...props}
    on:click
    class:bx--contained-list-item__content="{true}"
  >
    {#if icon}
      <div class:bx--contained-list-item__icon="{true}">
        <svelte:component this="{icon}" />
      </div>
    {/if}
    <slot />
  </svelte:element>
  {#if $$slots.action}
    <div class:bx--contained-list__action="{true}">
      <slot name="action" />
    </div>
  {/if}
</li>
