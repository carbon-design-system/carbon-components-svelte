<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let range = false;
  export let style = undefined;

  import { cx, fillArray } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item')} {style}>
  <div
    class={cx('--date-picker', '--skeleton', range && '--date-picker--range', !range && '--date-picker--short', !range && '--date-picker--simple', className)}>
    {#each fillArray(range ? 2 : 1) as input, i (input)}
      <div class={cx('--date-picker-container')}>
        <label class={cx('--label')} for={id} />
        <div class={cx('--date-picker__input', '--skeleton')} />
      </div>
    {/each}
  </div>
</div>
