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
   * @type {typeof import("svelte").SvelteComponent<any>}
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
    class:cds--tag="{true}"
    class:cds--tag--disabled="{disabled}"
    class:cds--tag--filter="{filter}"
    class:cds--tag--sm="{size === 'sm'}"
    class:cds--tag--red="{type === 'red'}"
    class:cds--tag--magenta="{type === 'magenta'}"
    class:cds--tag--purple="{type === 'purple'}"
    class:cds--tag--blue="{type === 'blue'}"
    class:cds--tag--cyan="{type === 'cyan'}"
    class:cds--tag--teal="{type === 'teal'}"
    class:cds--tag--green="{type === 'green'}"
    class:cds--tag--gray="{type === 'gray'}"
    class:cds--tag--cool-gray="{type === 'cool-gray'}"
    class:cds--tag--warm-gray="{type === 'warm-gray'}"
    class:cds--tag--high-contrast="{type === 'high-contrast'}"
    class:cds--tag--outline="{type === 'outline'}"
    {...$$restProps}
  >
    <slot props="{{ class: 'cds--tag__label' }}">
      <span class:cds--tag__label="{true}">{type}</span>
    </slot>
    <button
      type="button"
      aria-labelledby="{id}"
      class:cds--tag__close-icon="{true}"
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
    class:cds--tag="{true}"
    class:cds--tag--interactive="{true}"
    class:cds--tag--disabled="{disabled}"
    class:cds--tag--sm="{size === 'sm'}"
    class:cds--tag--red="{type === 'red'}"
    class:cds--tag--magenta="{type === 'magenta'}"
    class:cds--tag--purple="{type === 'purple'}"
    class:cds--tag--blue="{type === 'blue'}"
    class:cds--tag--cyan="{type === 'cyan'}"
    class:cds--tag--teal="{type === 'teal'}"
    class:cds--tag--green="{type === 'green'}"
    class:cds--tag--gray="{type === 'gray'}"
    class:cds--tag--cool-gray="{type === 'cool-gray'}"
    class:cds--tag--warm-gray="{type === 'warm-gray'}"
    class:cds--tag--high-contrast="{type === 'high-contrast'}"
    class:cds--tag--outline="{type === 'outline'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:cds--tag__custom-icon="{true}">
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    id="{id}"
    class:cds--tag="{true}"
    class:cds--tag--disabled="{disabled}"
    class:cds--tag--sm="{size === 'sm'}"
    class:cds--tag--red="{type === 'red'}"
    class:cds--tag--magenta="{type === 'magenta'}"
    class:cds--tag--purple="{type === 'purple'}"
    class:cds--tag--blue="{type === 'blue'}"
    class:cds--tag--cyan="{type === 'cyan'}"
    class:cds--tag--teal="{type === 'teal'}"
    class:cds--tag--green="{type === 'green'}"
    class:cds--tag--gray="{type === 'gray'}"
    class:cds--tag--cool-gray="{type === 'cool-gray'}"
    class:cds--tag--warm-gray="{type === 'warm-gray'}"
    class:cds--tag--high-contrast="{type === 'high-contrast'}"
    class:cds--tag--outline="{type === 'outline'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:cds--tag__custom-icon="{true}">
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
