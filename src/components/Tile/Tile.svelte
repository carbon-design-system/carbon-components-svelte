<script>
  let className = undefined;
  export { className as class };
  export let light = false;
  export let props = {};

  import { cx } from '../../lib';

  $: _class = cx('--tile', light && '--tile--light', className);
</script>

<div class={_class} {...props}>
  <slot />
</div>
