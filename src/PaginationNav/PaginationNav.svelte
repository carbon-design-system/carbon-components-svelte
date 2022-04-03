<script>
  /**
   * @event {{ page: number; }} change
   * @event {{ page: number; }} click:button--previous
   * @event {{ page: number; }} click:button--next
   */

  /** Specify the current page index */
  export let page = 0;

  /** Specify the total number of pages */
  export let total = 10;

  /** Specify the total number of pages to show */
  export let shown = 10;

  /** Set to `true` to loop the navigation */
  export let loop = false;

  /** Specify the forward button text */
  export let forwardText = "Next page";

  /** Specify the backward button text */
  export let backwardText = "Previous page";

  import { afterUpdate, createEventDispatcher } from "svelte";
  import CaretLeft from "../icons/CaretLeft.svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import PaginationItem from "./PaginationItem.svelte";
  import PaginationOverflow from "./PaginationOverflow.svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();
  const MIN = 4;

  afterUpdate(() => {
    dispatch("change", { page });
  });

  let front = 0;
  let back = 0;

  $: fit = shown >= MIN ? shown : MIN;
  $: startOffset = fit <= MIN && page > 1 ? 0 : 1;
  $: if (fit >= total) {
    front = 0;
    back = 0;
  }
  $: if (fit < total) {
    const split = Math.ceil(fit / 2) - 1;

    front = page - split + 1;
    back = total - page - (fit - split) + 1;

    if (front <= 1) {
      back -= front <= 0 ? Math.abs(front) + 1 : 0;
      front = 0;
    }

    if (back <= 1) {
      front -= back <= 0 ? Math.abs(back) + 1 : 0;
      back = 0;
    }
  }
  $: items = Array.from({ length: total })
    .map((e, i) => i)
    .slice(startOffset + front, (back + 1) * -1);
</script>

<nav aria-label="pagination" class:bx--pagination-nav="{true}" {...$$restProps}>
  <ul class:bx--pagination-nav__list="{true}">
    <li class:bx--pagination-nav__list-item="{true}">
      <Button
        kind="ghost"
        tooltipAlignment="center"
        tooltipPosition="bottom"
        iconDescription="{backwardText}"
        disabled="{!loop && page === 0}"
        icon="{CaretLeft}"
        on:click="{() => {
          if (page - 1 < 0) {
            if (loop) page = total - 1;
          } else {
            page--;
          }
          dispatch('click:button--previous', { page });
        }}"
      />
    </li>
    {#if fit > MIN || (fit <= MIN && page <= 1)}
      <PaginationItem
        page="{1}"
        active="{page === 0}"
        on:click="{() => (page = 0)}"
      >
        {page === 0 ? "Active, Page" : "Page"}
      </PaginationItem>
    {/if}
    <PaginationOverflow
      fromIndex="{startOffset}"
      count="{front}"
      on:select="{({ detail }) => (page = detail.index)}"
    />
    {#each items as item}
      <PaginationItem
        page="{item + 1}"
        active="{page === item}"
        on:click="{() => (page = item)}"
      >
        {page === item ? "Active, Page" : "Page"}
      </PaginationItem>
    {/each}
    <PaginationOverflow
      fromIndex="{total - back - 1}"
      count="{back}"
      on:select="{({ detail }) => {
        page = detail.index;
      }}"
    />
    {#if total > 1}
      <PaginationItem
        page="{total}"
        active="{page === total - 1}"
        on:click="{() => (page = total - 1)}"
      >
        {page === total - 1 ? "Active, Page" : "Page"}
      </PaginationItem>
    {/if}
    <li class:bx--pagination-nav__list-item="{true}">
      <Button
        kind="ghost"
        tooltipAlignment="center"
        tooltipPosition="bottom"
        iconDescription="{forwardText}"
        disabled="{!loop && page === total - 1}"
        icon="{CaretRight}"
        on:click="{() => {
          if (page + 1 >= total) {
            if (loop) page = 0;
          } else {
            page++;
          }
          dispatch('click:button--next', { page });
        }}"
      />
    </li>
  </ul>
  <div
    aria-live="polite"
    aria-atomic="true"
    class:bx--pagination-nav__accessibility-label="{true}"
  >
    Page
    {page + 1}
    of
    {total}
  </div>
</nav>
