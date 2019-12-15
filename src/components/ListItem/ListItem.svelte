<script>
  let className = undefined;
  export { className as class };
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--list__item', className);
</script>

<li {...props} class={_class}>
  <slot />
</li>
