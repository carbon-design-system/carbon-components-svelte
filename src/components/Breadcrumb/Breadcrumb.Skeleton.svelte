<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--breadcrumb', '--skeleton', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  {#each [0, 1, 2] as item, i (item)}
    <div class={cx('--breadcrumb-item')}>
      <span class={cx('--link')}>&nbsp;</span>
    </div>
  {/each}
</div>
