<script>
  let className = undefined;
  export { className as class };
  export let type = 'single';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--snippet', '--skeleton', type === 'single' && '--snippet--single', type === 'multi' && '--snippet--multi', className)}
  {style}>
  <div class={cx('--snippet-container')}>
    {#if type === 'single'}
      <span />
    {:else if type === 'multi'}
      <span />
      <span />
      <span />
    {/if}
  </div>
</div>
