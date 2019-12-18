<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let disabled = false;
  export let inline = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--link',
    disabled && '--link--disabled',
    inline && '--link--inline',
    className
  );
</script>

{#if disabled}
  <p on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class}>
    <slot />
  </p>
{:else}
  <a on:click on:mouseover on:mouseenter on:mouseleave {style} class={_class} {href}>
    <slot />
  </a>
{/if}
