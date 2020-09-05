<script>
  /**
   * Specify the number of accordion items to render
   * @type {number} [count=4]
   */
  export let count = 4;

  /**
   * Set to `false` to close the first accordion item
   * @type {boolean} [open=true]
   */
  export let open = true;

  import ChevronRight16 from "carbon-icons-svelte/lib/ChevronRight16";
  import { SkeletonText } from "../SkeletonText";
</script>

<ul
  class:bx--accordion="{true}"
  class:bx--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  {#if open}
    <li
      class:bx--accordion__item="{true}"
      class:bx--accordion__item--active="{true}">
      <span class:bx--accordion__heading="{true}">
        <ChevronRight16 class="bx--accordion__arrow" />
        <SkeletonText class="bx--accordion__title" />
      </span>
      <div class="bx--accordion__content">
        <SkeletonText width="90%" />
        <SkeletonText width="80%" />
        <SkeletonText width="95%" />
      </div>
    </li>
  {/if}
  {#each Array.from({ length: open ? count - 1 : count }, (_, i) => i) as item, i (item)}
    <li class="bx--accordion__item">
      <span class="bx--accordion__heading">
        <ChevronRight16 class="bx--accordion__arrow" />
        <SkeletonText class="bx--accordion__title" />
      </span>
    </li>
  {/each}
</ul>
