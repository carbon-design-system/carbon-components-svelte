<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--form-item', className);
</script>

<label on:click on:mouseover on:mouseenter on:mouseleave for={id} class={_class} {style}>
  <slot />
</label>
