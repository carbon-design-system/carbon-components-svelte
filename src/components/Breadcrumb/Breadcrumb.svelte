<script>
  let className = undefined;
  export { className as class };
  export let noTrailingSlash = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const ariaLabel = $$props['aria-label'] || 'Breadcrumb';
  const _class = cx('--breadcrumb', noTrailingSlash && '--breadcrumb--no-trailing-slash');
</script>

<nav
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-label={ariaLabel}
  class={className}
  {style}>
  <ol class={_class}>
    <slot />
  </ol>
</nav>
