<script>
  let className = undefined;
  export { className as class };
  export let nested = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--list--ordered', nested && '--list--nested', className);
</script>

<ol on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</ol>
