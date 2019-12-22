<script>
  let className = undefined;
  export { className as class };
  export let head = false;
  export let noWrap = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    head && '--structured-list-th',
    !head && '--structured-list-td',
    noWrap && '--structured-list-content--nowrap',
    className
  );
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</div>
