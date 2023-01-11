<script>
  /** @restProps {div | span} */

  /**
   * Specify the type of tag
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline"}
   */
  export let type = undefined;

  /** @type {"sm" | "default"} */
  export let size = "default";

  /** Set to `true` to use filterable variant */
  export let filter = false;

  /** Set to `true` to disable a filterable tag */
  export let disabled = false;

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set the title for the close button in a filterable tag */
  export let title = "Clear filter";

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = undefined;

  /** Set an id for the filterable tag */
  export let id = "ccs-" + Math.random().toString(36);

  import { createEventDispatcher } from "svelte";
  import Close from "../icons/Close.svelte";
  import TagSkeleton from "./TagSkeleton.svelte";

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <TagSkeleton
    size="{size}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if filter}
  <div
    aria-label="{title}"
    id="{id}"
    class:bx--tag="{true}"
    class:bx--tag--disabled="{disabled}"
    class:bx--tag--filter="{filter}"
    class:bx--tag--sm="{size === 'sm'}"
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
    class:bx--tag--outline="{type === 'outline'}"
    {...$$restProps}
  >
    <slot props="{{ class: 'bx--tag__label' }}">
      <span class:bx--tag__label="{true}">{type}</span>
    </slot>
    <button
      type="button"
      aria-labelledby="{id}"
      class:bx--tag__close-icon="{true}"
      disabled="{disabled}"
      title="{title}"
      on:click|stopPropagation
      on:click|stopPropagation="{() => {
        dispatch('close');
      }}"
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      <Close />
    </button>
  </div>
{:else if interactive}
  <button
    type="button"
    id="{id}"
    disabled="{disabled}"
    aria-disabled="{disabled}"
    tabindex="{disabled ? '-1' : undefined}"
    class:bx--tag="{true}"
    class:bx--tag--interactive="{true}"
    class:bx--tag--disabled="{disabled}"
    class:bx--tag--sm="{size === 'sm'}"
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
    class:bx--tag--outline="{type === 'outline'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon="{true}">
        <slot name="icon">
          <svelte:component this="{icon}" />
        </slot>
      </div>
    {/if}
    <span>
      <slot />
    </span>
  </button>
{:else}
  <div
    id="{id}"
    class:bx--tag="{true}"
    class:bx--tag--disabled="{disabled}"
    class:bx--tag--sm="{size === 'sm'}"
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
    class:bx--tag--outline="{type === 'outline'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon="{true}">
        <slot name="icon">
          <svelte:component this="{icon}" />
        </slot>
      </div>
    {/if}
    <span>
      <slot />
    </span>
  </div>
{/if}
