<script>
  let className = undefined;
  export { className as class };
  export let nested = false;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--list--ordered', nested && '--list--nested', className);
</script>

<ol {...props} class={_class}>
  <slot />
</ol>
