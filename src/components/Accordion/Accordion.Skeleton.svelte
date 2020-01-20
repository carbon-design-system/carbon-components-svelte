<script>
  let className = undefined;
  export { className as class };
  export let count = 4;
  export let open = true;
  export let style = undefined;

  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { cx, fillArray } from '../../lib';
  import SkeletonText from '../SkeletonText';
</script>

<ul
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--accordion', '--skeleton', className)}
  {style}>
  {#if open}
    <li class={cx('--accordion__item', '--accordion__item--active')}>
      <span class={cx('--accordion__heading')}>
        <ChevronRight16 class={cx('--accordion__arrow')} />
        <SkeletonText class={cx('--accordion__title')} />
      </span>
      <div class={cx('--accordion__content')}>
        <SkeletonText width="90%" />
        <SkeletonText width="80%" />
        <SkeletonText width="95%" />
      </div>
    </li>
  {/if}
  {#each fillArray(open ? count - 1 : count) as item, i (item)}
    <li class={cx('--accordion__item')}>
      <span class={cx('--accordion__heading')}>
        <ChevronRight16 class={cx('--accordion__arrow')} />
        <SkeletonText class={cx('--accordion__title')} />
      </span>
    </li>
  {/each}
</ul>
