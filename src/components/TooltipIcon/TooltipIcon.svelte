<script>
  let className = undefined;
  export { className as class };
  export let direction = 'bottom';
  export let align = 'center';
  export let id = Math.random();
  export let tooltipText = '';
  export let props = {};

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
  {...props}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={_class}
  aria-describedby={id}>
  <span class={cx('--assistive-text')} {id}>{tooltipText}</span>
  <slot />
</button>
