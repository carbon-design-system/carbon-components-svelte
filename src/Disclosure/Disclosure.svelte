<script>
  /**
   * @restProps {div}
   * @slot {{}} summary - Content for the always-visible trigger.
   * @slot {{}}
   * @event {boolean} toggle - Dispatched with the new open state.
   */

  /**
   * Specify the summary content of the trigger.
   * Alternatively, use the "summary" slot.
   * @example
   * ```svelte
   * <Disclosure>
   *   <div slot="summary">Custom summary</div>
   * </Disclosure>
   * ```
   */
  export let summary = "";

  /**
   * Specify alignment of the chevron icon.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Set to `true` to open the disclosure.
   * @bindable writable
   */
  export let open = false;

  import { createEventDispatcher } from "svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";

  const dispatch = createEventDispatcher();

  const contentId = `ccs-${Math.random().toString(36)}`;

  let animation = undefined;

  function toggle() {
    open = !open;
    animation = open ? "expanding" : "collapsing";
    dispatch("toggle", open);
  }
</script>

<div
  class:bx--disclosure={true}
  class:bx--disclosure--start={align === "start"}
  class:bx--disclosure--end={align === "end"}
  class:bx--disclosure--open={open}
  class:bx--disclosure--expanding={animation === "expanding"}
  class:bx--disclosure--collapsing={animation === "collapsing"}
  {...$$restProps}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}
>
  <button
    type="button"
    class:bx--disclosure__control={true}
    aria-expanded={open}
    aria-controls={contentId}
    on:click
    on:click={toggle}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:focus
    on:blur
  >
    <ChevronRight class="bx--disclosure__arrow" />
    <span class:bx--disclosure__summary={true}>
      <slot name="summary">{summary}</slot>
    </span>
  </button>
  <div id={contentId} class:bx--disclosure__content={true}>
    <slot />
  </div>
</div>
