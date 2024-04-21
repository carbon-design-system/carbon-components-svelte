<script>
  // @ts-check

  /**
   * Specify the title of the accordion item heading.
   * Use the "title" slot for custom elements.
   * @example <svelte:fragment slot="title">...</svelte:fragment>
   */
  export let title = "title";

  /** Set to `true` to open the first accordion item. */
  export let open = false;

  /** Set to `true` to disable the accordion item. */
  export let disabled = false;

  /** Specify the ARIA label for the accordion item chevron icon. */
  export let iconDescription = "Expand/Collapse";

  import { getContext } from "svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";

  // Internal id for controls
  const id = "ccs-" + Math.random().toString(36);

  /** @type {{ disableItems: import("svelte/store").Writable<boolean>; }} */
  const { disableItems } = getContext("Accordion") ?? {};

  $: disabled = disableItems ? $disableItems === true : disabled;

  /** @type {undefined | "expanding" | "collapsing"} */
  let animation = undefined;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  class:bx--accordion__item="{true}"
  class:bx--accordion__item--active="{open && !disabled}"
  class:bx--accordion__item--disabled="{disabled}"
  class:bx--accordion__item--expanding="{animation === 'expanding'}"
  class:bx--accordion__item--collapsing="{animation === 'collapsing'}"
  on:animationend
  on:animationend="{() => {
    animation = undefined;
  }}"
>
  <button
    type="button"
    class:bx--accordion__heading="{true}"
    title="{iconDescription}"
    aria-controls="{id}"
    aria-expanded="{open}"
    disabled="{disabled}"
    on:click
    on:click="{() => {
      open = !open;
      animation = open ? 'expanding' : 'collapsing';
    }}"
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown="{({ key }) => {
      if (open && key === 'Escape') {
        open = false;
      }
    }}"
  >
    <ChevronRight class="bx--accordion__arrow" aria-label="{iconDescription}" />
    <div class:bx--accordion__title="{true}">
      <slot name="title">{title}</slot>
    </div>
  </button>
  <div class:bx--accordion__wrapper="{true}">
    <div id="{id}" class:bx--accordion__content="{true}">
      <slot />
    </div>
  </div>
</li>
