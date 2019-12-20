<script>
  let className = undefined;
  export { className as class };
  export let light = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--tile', light && '--tile--light', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</div>
