<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Spread `props` onto a custom element to inherit the link class
   * and `aria-current` attribute when `isCurrentPage` is set.
   * @example
   * ```svelte
   * <BreadcrumbItem let:props>
   *   <a {...props} href="/">Home</a>
   * </BreadcrumbItem>
   * ```
   * @restProps {li}
   * @slot {{props?: { "aria-current"?: string; class: "bx--link"; }}}
   */

  /**
   * Set the `href` to use an anchor link.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` if the breadcrumb item represents the current page */
  export let isCurrentPage = false;

  /**
   * Specify the icon to render before the label.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  import { getContext, setContext } from "svelte";
  import Link from "../Link/Link.svelte";

  setContext("carbon:BreadcrumbItem", {});

  const { separator: separatorStore } = getContext("carbon:Breadcrumb");

  $: ({ "aria-current": ariaCurrent, ...liProps } = $$restProps);
</script>

<li
  class:bx--breadcrumb-item={true}
  class:bx--breadcrumb-item--current={isCurrentPage || ariaCurrent === "page"}
  {...liProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if href}
    <Link
      {href}
      aria-current={ariaCurrent ?? (isCurrentPage ? "page" : undefined)}
    >
      {#if $$slots.icon || icon}
        <div class:bx--breadcrumb-item__icon={true}>
          <slot name="icon"> <svelte:component this={icon} /> </slot>
        </div>
      {/if}
      <slot />
    </Link>
  {:else}
    {#if $$slots.icon || icon}
      <div class:bx--breadcrumb-item__icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    <slot
      props={{
        "aria-current": ariaCurrent ?? (isCurrentPage ? "page" : undefined),
        class: "bx--link",
      }}
    />
  {/if}
  {#if typeof $separatorStore !== "string"}
    <span class:bx--breadcrumb-item__separator={true} aria-hidden="true">
      <svelte:component this={$separatorStore} />
    </span>
  {/if}
</li>
