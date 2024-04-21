<script>
  // @ts-check

  /**
   * @slot {{props?: Pick<AriaAttributes, "aria-current"> & { class: "bx--link"; }}}
   */

  /**
   * Set the `href` to use an anchor link.
   * The `Link` component is used if `href` is set.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` if the breadcrumb item represents the current page */
  export let isCurrentPage = false;

  import Link from "../Link/Link.svelte";

  import { setContext } from "svelte";

  setContext("BreadcrumbItem", {});

  $: ariaCurrent = $$props["aria-current"];
  $: current = isCurrentPage && ariaCurrent !== "page";
</script>

<li
  class:bx--breadcrumb-item="{true}"
  class:bx--breadcrumb-item--current="{current}"
  {...$$restProps}
  aria-current={undefined}
>
  {#if href}
    <Link
      href="{href}"
      aria-current="{ariaCurrent}"
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      <slot />
    </Link>
  {:else}
    <slot
      props="{{
        'aria-current': ariaCurrent,
        class: 'bx--link',
      }}"
    />
  {/if}
</li>
