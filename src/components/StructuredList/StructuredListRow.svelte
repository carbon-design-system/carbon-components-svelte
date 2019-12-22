<script>
  let className = undefined;
  export { className as class };
  export let head = false;
  export let label = false;
  export let tabindex = '0';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--structured-list-row',
    head && '--structured-list-row--header-row',
    className
  );
</script>

{#if label}
  <label
    role="presentation"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    class={_class}
    for={$$props.for}
    {tabindex}
    {style}>
    <slot />
  </label>
{:else}
  <div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
    <slot />
  </div>
{/if}
