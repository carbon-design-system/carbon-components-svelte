<script>
  /** Specify the number of accordion items to render */
  export let count = 4;

  /**
   * Specify alignment of accordion item chevron icon
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Specify the size of the accordion
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `false` to close the first accordion item */
  export let open = true;

  import ChevronRight from "../icons/ChevronRight.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<ul
  class:cds--skeleton="{true}"
  class:cds--accordion="{true}"
  class:cds--accordion--start="{align === 'start'}"
  class:cds--accordion--end="{align === 'end'}"
  class:cds--accordion--sm="{size === 'sm'}"
  class:cds--accordion--xl="{size === 'xl'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if open}
    <li
      class:cds--accordion__item="{true}"
      class:cds--accordion__item--active="{true}"
    >
      <span class:cds--accordion__heading="{true}">
        <ChevronRight class="cds--accordion__arrow" />
        <SkeletonText class="cds--accordion__title" />
      </span>
      <div class:cds--accordion__content="{true}">
        <SkeletonText width="90%" />
        <SkeletonText width="80%" />
        <SkeletonText width="95%" />
      </div>
    </li>
  {/if}
  {#each Array.from({ length: open ? count - 1 : count }, (_, i) => i) as item (item)}
    <li class:cds--accordion__item="{true}">
      <span class:cds--accordion__heading="{true}">
        <ChevronRight class="cds--accordion__arrow" />
        <SkeletonText class="cds--accordion__title" />
      </span>
    </li>
  {/each}
</ul>
