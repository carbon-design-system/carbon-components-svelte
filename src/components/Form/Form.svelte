<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--form', className);
</script>

<form class={_class} {style}>
  <slot />
</form>
