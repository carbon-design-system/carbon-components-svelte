<script>
  let className = undefined;
  export { className as class };
  export let direction = 'bottom';
  export let align = 'center';
  export let id = Math.random();
  export let tooltipText = '';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--tooltip__trigger',
    '--tooltip--a11y',
    `--tooltip--${direction}`,
    `--tooltip--align-${align}`,
    className
  );
</script>

<button
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-describedby={id}
  class={_class}
  {style}>
  <span class={cx('--assistive-text')} {id}>{tooltipText}</span>
  <slot />
</button>
