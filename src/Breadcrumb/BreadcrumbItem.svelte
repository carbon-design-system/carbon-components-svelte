<script>
  /**
   * Set the `href` to use an anchor link
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Set to `true` if the breadcrumb item represents the current page
   * @type {boolean} [isCurrentPage=false]
   */
  export let isCurrentPage = false;

  import { Link } from "../Link";
</script>

<li
  class:bx--breadcrumb-item="{true}"
  class:bx--breadcrumb-item--current="{isCurrentPage && $$restProps['aria-current'] !== 'page'}"
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
      props="{{ 'aria-current': $$restProps['aria-current'], class: 'bx--link' }}"
    />
  {/if}
</li>
