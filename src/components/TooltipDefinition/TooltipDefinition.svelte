<script>
  let className = undefined;
  export { className as class };
  export let align = 'center';
  export let direction = 'bottom';
  export let id = Math.random();
  export let style = undefined;
  export let tooltipText = '';

  import { cx } from '../../lib';
</script>

<div class={cx('--tooltip--definition', '--tooltip--a11y', className)} {style}>
  <button
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--tooltip__trigger', '--tooltip--a11y', '--tooltip__trigger--definition', `--tooltip--${direction}`, `--tooltip--align-${align}`)}
    aria-describedby={id}>
    <slot />
  </button>
  <div role="tooltip" class={cx('--assistive-text')} {id}>{tooltipText}</div>
</div>
