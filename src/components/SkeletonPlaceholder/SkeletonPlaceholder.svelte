<script>
  let className = undefined;
  export { className as class };
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--skeleton__placeholder', className);
</script>

<div {...props} class={_class} />
