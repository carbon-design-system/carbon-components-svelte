<script>
  let className = undefined;
  export { className as class };
  export let noTrailingSlash = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<nav
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-label={$$props['aria-label'] || 'Breadcrumb'}
  class={className}
  {style}>
  <ol class={cx('--breadcrumb', noTrailingSlash && '--breadcrumb--no-trailing-slash')}>
    <slot />
  </ol>
</nav>
