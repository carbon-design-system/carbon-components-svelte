<script>
  // @ts-check

  /** Specify the number of accordion items. */
  export let count = 4;

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

  /** Set to `true` to expand the first accordion item */
  export let open = false;

  import ChevronRight from "../icons/ChevronRight.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

<ul
  class:bx--skeleton="{true}"
  class:bx--accordion="{true}"
  class:bx--accordion--start="{align === 'start'}"
  class:bx--accordion--end="{align === 'end'}"
  class:bx--accordion--flush="{flush && align !== 'start'}"
  class:bx--layout--size-sm="{size === 'sm'}"
  class:bx--layout--size-md="{size === 'md'}"
  class:bx--layout--size-lg="{size === 'lg'}"
>
  {#if open}
    <li
      class:bx--accordion__item="{true}"
      class:bx--accordion__item--active="{true}"
    >
      <span class:bx--accordion__heading="{true}">
        <ChevronRight class="bx--accordion__arrow" />
        <SkeletonText class="bx--accordion__title" />
      </span>
      <div class:bx--accordion__content="{true}">
        <SkeletonText width="90%" />
        <SkeletonText width="80%" />
        <SkeletonText width="95%" />
      </div>
    </li>
  {/if}
  {#each Array.from({ length: open ? count - 1 : count }) as item}
    <li class:bx--accordion__item="{true}">
      <span class:bx--accordion__heading="{true}">
        <ChevronRight class="bx--accordion__arrow" />
        <SkeletonText class="bx--accordion__title" />
      </span>
    </li>
  {/each}
</ul>
