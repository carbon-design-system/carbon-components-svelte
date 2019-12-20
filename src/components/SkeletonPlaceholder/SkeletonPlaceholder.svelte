<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--skeleton__placeholder', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class} />
