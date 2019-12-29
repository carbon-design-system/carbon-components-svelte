<script>
  let className = undefined;
  export { className as class };
  export let hideLabel = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  {#if !hideLabel}
    <span class={cx('--label', '--skeleton')} />
  {/if}
  <div class={cx('--number', '--skeleton')} />
</div>
