<script>
  /** @restProps {div | span} */

  /**
   * Specify the type of tag
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast"}
   */
  export let type = undefined;

  /** Set to `true` to use filterable variant */
  export let filter = false;

  /** Set to `true` to disable a filterable tag */
  export let disabled = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set the title for the close button in a filterable tag */
  export let title = "Clear filter";

  /** Set an id for the filterable tag */
  export let id = "ccs-" + Math.random().toString(36);

  import Close16 from "carbon-icons-svelte/lib/Close16/Close16.svelte";
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
      class:bx--tag--red="{type === 'red'}"
      class:bx--tag--magenta="{type === 'magenta'}"
      class:bx--tag--purple="{type === 'purple'}"
      class:bx--tag--blue="{type === 'blue'}"
      class:bx--tag--cyan="{type === 'cyan'}"
      class:bx--tag--teal="{type === 'teal'}"
      class:bx--tag--green="{type === 'green'}"
      class:bx--tag--gray="{type === 'gray'}"
      class:bx--tag--cool-gray="{type === 'cool-gray'}"
      class:bx--tag--warm-gray="{type === 'warm-gray'}"
      class:bx--tag--high-contrast="{type === 'high-contrast'}"
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
      class:bx--tag--red="{type === 'red'}"
      class:bx--tag--magenta="{type === 'magenta'}"
      class:bx--tag--purple="{type === 'purple'}"
      class:bx--tag--blue="{type === 'blue'}"
      class:bx--tag--cyan="{type === 'cyan'}"
      class:bx--tag--teal="{type === 'teal'}"
      class:bx--tag--green="{type === 'green'}"
      class:bx--tag--gray="{type === 'gray'}"
      class:bx--tag--cool-gray="{type === 'cool-gray'}"
      class:bx--tag--warm-gray="{type === 'warm-gray'}"
      class:bx--tag--high-contrast="{type === 'high-contrast'}"
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      <slot />
    </span>
  {/if}
{/if}
