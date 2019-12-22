<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--tag', '--skeleton', className);
</script>

<span on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style} />
