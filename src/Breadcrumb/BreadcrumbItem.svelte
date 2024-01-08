<script>
  /**
   * @slot {{props?: { ["aria-current"]?: string; class: "cds--link"; }}}
   */

  /**
   * Set the `href` to use an anchor link
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` if the breadcrumb item represents the current page */
  export let isCurrentPage = false;

  import Link from "../Link/Link.svelte";

  import { setContext } from "svelte";

  setContext("BreadcrumbItem", {});
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<li
  class:cds--breadcrumb-item="{true}"
  class:cds--breadcrumb-item--current="{isCurrentPage &&
    $$restProps['aria-current'] !== 'page'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if href}
    <Link href="{href}" aria-current="{$$restProps['aria-current']}">
      <slot />
    </Link>
  {:else}
    <slot
      props="{{
        'aria-current': $$restProps['aria-current'],
        class: 'cds--link',
      }}"
    />
  {/if}
</li>
