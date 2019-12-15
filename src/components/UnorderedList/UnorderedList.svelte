<script>
  let className = undefined;
  export { className as class };
  export let nested = false;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--list--unordered', nested && '--list--nested', className);
</script>

<ul {...props} class={_class}>
  <slot />
</ul>
