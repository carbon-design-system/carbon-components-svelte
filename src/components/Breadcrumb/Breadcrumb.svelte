<script>
  let className = undefined;
  export { className as class };
  export let noTrailingSlash = false;

  import { cx } from '../../lib';

  const ariaLabel = $$props['aria-label'] || 'Breadcrumb';
  const _class = cx('--breadcrumb', noTrailingSlash && '--breadcrumb--no-trailing-slash');
</script>

<nav class={className} aria-label={ariaLabel}>
  <ol class={_class}>
    <slot />
  </ol>
</nav>
