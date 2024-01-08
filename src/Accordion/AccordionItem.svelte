<script>
  /**
   * Specify the title of the accordion item heading.
   * Alternatively, use the "title" slot (e.g., `<div slot="title">...</div>`)
   */
  export let title = "title";

  /** Set to `true` to open the first accordion item */
  export let open = false;

  /** Set to `true` to disable the accordion item */
  export let disabled = false;

  /** Specify the ARIA label for the accordion item chevron icon */
  export let iconDescription = "Expand/Collapse";

  import { onMount, getContext } from "svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";

  let initialDisabled = disabled;

  const ctx = getContext("Accordion");
  const unsubscribe = ctx.disableItems.subscribe((value) => {
    if (!value && initialDisabled) return;
    disabled = value;
  });

  let animation = undefined;

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  class:cds--accordion__item="{true}"
  class:cds--accordion__item--active="{open}"
  class:cds--accordion__item--disabled="{disabled}"
  class:cds--accordion__item--expanding="{animation === 'expanding'}"
  class:cds--accordion__item--collapsing="{animation === 'collapsing'}"
  {...$$restProps}
  on:animationend
  on:animationend="{() => {
    animation = undefined;
  }}"
>
  <button
    type="button"
    class:cds--accordion__heading="{true}"
    title="{iconDescription}"
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
    <ChevronRight
      class="cds--accordion__arrow"
      aria-label="{iconDescription}"
    />
    <div class:cds--accordion__title="{true}">
      <slot name="title">{title}</slot>
    </div>
  </button>
  <div class:cds--accordion__content="{true}">
    <slot />
  </div>
</li>
