<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  $: _class = cx('--form', className);
</script>

<form on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</form>
