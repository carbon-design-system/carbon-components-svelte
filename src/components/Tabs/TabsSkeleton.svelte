<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--tabs', '--skeleton', className)}
  {style}>
  <div class={cx('--tabs-trigger')}>
    <div class={cx('--tabs-trigger-text')}>&nbsp;</div>
    <svg width="10" height="5" viewBox="0 0 10 5" fill-rule="evenodd">
      <path d="M10 0L5 5 0 0z" />
    </svg>
  </div>
  <ul class={cx('--tabs__nav', '--tabs__nav--hidden')}>
    {#each [0, 1, 2, 3] as item, i (item)}
      <li class={cx('--tabs__nav-item')}>
        <div class={cx('--tabs__nav-link')}>&nbsp;</div>
      </li>
    {/each}
  </ul>
</div>
