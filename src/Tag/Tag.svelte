<script>
  /**
   * Specify the type of tag
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast"} [type]
   */
  export let type = undefined;

  /**
   * Set to `true` to use filterable variant
   * @type {boolean}
   */
  export let filter = false;

  /**
   * Set to `true` to disable a filterable tag
   * @type {boolean}
   */
  export let disabled = false;

  /**
   * Set to `true` to display the skeleton state
   * @type {boolean}
   */
  export let skeleton = false;

  /**
   * Set the title for the close button in a filterable tag
   * @type {string}
   */
  export let title = "Clear filter";

  /**
   * Set an id for the filterable tag
   * @type {string}
   */
  export let id = "ccs-" + Math.random().toString(36);

  import Close16 from "carbon-icons-svelte/lib/Close16";
  import TagSkeleton from "./TagSkeleton.svelte";
</script>

{#if skeleton}
  <TagSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  {#if filter}
    <div
      aria-label="{title}"
      id="{id}"
      class:bx--tag="{true}"
      class:bx--tag--disabled="{disabled}"
      class:bx--tag--filter="{filter}"
      {...$$restProps}
      class="{type && `bx--tag--${type}`} {$$restProps.class}"
    >
      <slot props="{{ class: 'bx--tag__label' }}">
        <span class:bx--tag__label="{true}">{type}</span>
      </slot>
      <button
        aria-labelledby="{id}"
        class:bx--tag__close-icon="{true}"
        disabled="{disabled}"
        title="{title}"
        on:click|stopPropagation
        on:mouseover
        on:mouseenter
        on:mouseleave
      >
        <Close16 />
      </button>
    </div>
  {:else}
    <span
      class:bx--tag="{true}"
      class:bx--tag--disabled="{disabled}"
      {...$$restProps}
      class="{type && `bx--tag--${type}`} {$$restProps.class}"
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      <slot />
    </span>
  {/if}
{/if}
