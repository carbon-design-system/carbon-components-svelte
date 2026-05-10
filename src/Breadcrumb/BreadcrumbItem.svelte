<script>
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

  import { setContext } from "svelte";
  import Link from "../Link/Link.svelte";

  setContext("carbon:BreadcrumbItem", {});

  $: ({ "aria-current": ariaCurrent, ...liProps } = $$restProps);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
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
      <slot />
    </Link>
  {:else}
    <slot
      props={{
        "aria-current": ariaCurrent ?? (isCurrentPage ? "page" : undefined),
        class: "bx--link",
      }}
    />
  {/if}
</li>
