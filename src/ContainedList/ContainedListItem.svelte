<script>
  /**
   * @template [Icon=any]
   * @restProps {a | button | div}
   */

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /** Set to `true` to disable the list item */
  export let disabled = false;

  /**
   * Specify the `href` attribute.
   * Renders an anchor with clickable styles. Takes precedence over `interactive`.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the item content.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  $: isLink = Boolean(href);
  $: isClickable = isLink || interactive;
  $: tag = isLink ? "a" : interactive ? "button" : "div";
  $: props = {
    type: tag === "button" ? "button" : undefined,
    disabled: tag === "button" ? disabled : undefined,
    href: isLink ? href : undefined,
    rel:
      isLink && $$restProps.target === "_blank"
        ? "noopener noreferrer"
        : undefined,
  };
</script>

<li
  class:bx--contained-list-item="{true}"
  class:bx--contained-list-item--clickable="{isClickable}"
  class:bx--contained-list-item--with-icon="{icon}"
  class:bx--contained-list-item--with-action="{$$slots.action}"
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svelte:element
    this="{tag}"
    {...props}
    {...$$restProps}
    on:click
    class:bx--contained-list-item__content="{true}"
  >
    {#if icon}
      <div class:bx--contained-list-item__icon="{true}">
        <svelte:component this="{icon}" />
      </div>
    {/if}
    <div><slot /></div>
  </svelte:element>
  {#if $$slots.action}
    <div class:bx--contained-list-item__action="{true}">
      <slot name="action" />
    </div>
  {/if}
</li>
