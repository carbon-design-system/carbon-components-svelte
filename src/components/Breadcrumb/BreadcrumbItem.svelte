<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let isCurrentPage = false;
  export let style = undefined;

  import { cx } from '../../lib';
  import Link from '../Link';

  const ariaCurrent = $$props['aria-current'];
  const _class = cx(
    '--breadcrumb-item',
    isCurrentPage && ariaCurrent !== 'page' && '--breadcrumb-item--current',
    className
  );
</script>

{#if href}
  <li on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
    <Link {href} aria-current={ariaCurrent}>
      <slot />
    </Link>
  </li>
{:else}
  <li on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
    <slot props={{ 'aria-current': ariaCurrent, class: cx('--link') }} />
  </li>
{/if}
