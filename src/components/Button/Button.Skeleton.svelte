<script>
  let className = undefined;
  export { className as class };
  export let small = false;
  export let href = undefined;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx('--skeleton', '--btn', small && '--btn--sm', className);
</script>

{#if href}
  <a {...props} class={_class} {href} role="button">{''}</a>
{:else}
  <div {...props} class={_class} />
{/if}
