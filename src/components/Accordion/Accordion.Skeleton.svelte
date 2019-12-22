<script>
  let className = undefined;
  export { className as class };
  export let open = true;
  export let count = 4;
  export let style = undefined;

  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { cx } from '../../lib';
  import SkeletonText from '../SkeletonText';

  const _class = cx('--accordion', '--skeleton', className);
  const skeletonItems = Array.from({ length: open ? count - 1 : count });
</script>

<ul on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class}>
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
  {#each skeletonItems as item}
    <li class={cx('--accordion__item')}>
      <span class={cx('--accordion__heading')}>
        <ChevronRight16 class={cx('--accordion__arrow')} />
        <SkeletonText class={cx('--accordion__title')} />
      </span>
    </li>
  {/each}
</ul>
