<script>
  /**
   * Specify the `href` attribute. Inside a `UIShellContainer` the default
   * links to that shell's `Content`.
   */
  export let href = "#main-content";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  import { getNavStores } from "./nav-store.js";

  const { contained, contentId } = getNavStores();

  $: resolvedHref =
    contained && href === "#main-content" ? `#${contentId}` : href;
</script>

<a
  href={resolvedHref}
  {tabindex}
  class:bx--skip-to-content={true}
  {...$$restProps}
  on:click
>
  <slot>Skip to main content</slot>
</a>
