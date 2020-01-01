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

<button
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-describedby={id}
  class={cx('--tooltip__trigger', '--tooltip--a11y', `--tooltip--${direction}`, `--tooltip--align-${align}`, className)}
  {style}>
  <span class={cx('--assistive-text')} {id}>{tooltipText}</span>
  <slot />
</button>
