<script>
  // @ts-check

  /**
   * Specify the alignment of the accordion item chevron icon.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Set to `true` to flush the accordion content text.
   *
   * **Note**: does not work with `align="start"`.
   */
  export let flush = false;

  /**
   * Specify the size of the accordion.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to disable all accordion items. */
  export let disabled = false;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const disableItems = writable(disabled);

  $: disableItems.set(disabled);

  setContext("Accordion", { disableItems });
</script>

<ul
  class:bx--accordion="{true}"
  class:bx--accordion--start="{align === 'start'}"
  class:bx--accordion--end="{align === 'end'}"
  class:bx--accordion--flush="{flush && align !== 'start'}"
  class:bx--layout--size-sm="{size === 'sm'}"
  class:bx--layout--size-md="{size === 'md'}"
  class:bx--layout--size-lg="{size === 'lg'}"
>
  <slot />
</ul>
