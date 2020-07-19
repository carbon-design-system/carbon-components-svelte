<script>
  export let type = undefined; // "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast"
  export let filter = false;
  export let disabled = false;
  export let title = "Clear filter";
  export let id = "ccs-" + Math.random().toString(36);

  import Close16 from "carbon-icons-svelte/lib/Close16";
</script>

{#if filter}
  <div
    aria-label={title}
    {id}
    class:bx--tag={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--filter={filter}
    {...$$restProps}
    class="{type && `bx--tag--${type}`}
    {$$restProps.class}">
    <slot props={{ class: 'bx--tag__label' }}>
      <span class:bx--tag__label={true}>{type}</span>
    </slot>
    <button
      aria-labelledby={id}
      class:bx--tag__close-icon={true}
      {disabled}
      {title}
      on:click|stopPropagation
      on:mouseover
      on:mouseenter
      on:mouseleave>
      <Close16 />
    </button>
  </div>
{:else}
  <span
    class:bx--tag={true}
    class:bx--tag--disabled={disabled}
    {...$$restProps}
    class="{type && `bx--tag--${type}`}
    {$$restProps.class}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <slot />
  </span>
{/if}
