<script>
  let className = undefined;
  export { className as class };
  export let type = 'single';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--snippet',
    '--skeleton',
    type === 'single' && '--snippet--single',
    type === 'multi' && '--snippet--multi',
    className
  );
</script>

{#if type === 'single'}
  <div on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class}>
    <div class={cx('--snippet-container')}>
      <span />
    </div>
  </div>
{:else if type === 'multi'}
  <div on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class}>
    <div class={cx('--snippet-container')}>
      <span />
      <span />
      <span />
    </div>
  </div>
{/if}
