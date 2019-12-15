<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let disabled = false;
  export let inline = false;
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx(
    '--link',
    disabled && '--link--disabled',
    inline && '--link--inline',
    className
  );
</script>

{#if disabled}
  <p {...props} class={_class}>
    <slot />
  </p>
{:else}
  <a {...props} class={_class} {href}>
    <slot />
  </a>
{/if}
