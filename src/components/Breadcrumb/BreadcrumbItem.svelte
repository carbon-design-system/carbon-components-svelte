<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let isCurrentPage = false;
  export let props = {};

  import { cx } from '../../lib';
  import Link from '../Link';

  const ariaCurrent = $$props['aria-current'];

  $: _class = cx(
    '--breadcrumb-item',
    isCurrentPage && ariaCurrent !== 'page' && '--breadcrumb-item--current',
    className
  );
  $: itemProps = { 'aria-current': ariaCurrent, class: cx('--link') };
</script>

{#if href}
  <li class={_class} {...props}>
    <Link {href} props={itemProps}>
      <slot />
    </Link>
  </li>
{:else}
  <li class={_class} {...props}>
    <slot props={itemProps} />
  </li>
{/if}
