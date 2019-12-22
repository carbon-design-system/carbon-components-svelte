<script>
  let className = undefined;
  export { className as class };
  export let direction = 'bottom';
  export let align = 'center';
  export let id = Math.random();
  export let triggerClassName = undefined;
  export { triggerClassName as triggerClass };
  export let tooltipText = '';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--tooltip--definition', '--tooltip--a11y', className);
  const _triggerClass = cx(
    '--tooltip__trigger',
    '--tooltip--a11y',
    '--tooltip__trigger--definition',
    `--tooltip--${direction}`,
    `--tooltip--align-${align}`,
    triggerClassName
  );
</script>

<div class={_class} {style}>
  <button
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={_triggerClass}
    aria-describedby={id}>
    <slot />
  </button>
  <div role="tooltip" class={cx('--assistive-text')} {id}>{tooltipText}</div>
</div>
