<script>
  /**
   * @event {{ page: number; }} change - fires after every user interaction
   * @event {{ page: number; }} click:button--previous
   * @event {{ page: number; }} click:button--next
   */

  /** Specify the current page index */
  export let page = 1;

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

  import { createEventDispatcher } from "svelte";
  import CaretLeft from "../icons/CaretLeft.svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import PaginationItem from "./PaginationItem.svelte";
  import PaginationOverflow from "./PaginationOverflow.svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();
  const MIN = 4;

  // number of overflow pages near the beginning of the nav
  let front = 0;

  // number of overflow pages near the end of the nav
  let back = 0;

  // number of nav overflow or items that may appear
  $: fit = shown >= MIN ? shown : MIN;
  $: startOffset = fit <= MIN && page > 1 ? 0 : 1;
  $: if (fit >= total) {
    front = 0;
    back = 0;
  }
  $: if (fit < total) {
    const split = Math.ceil(fit / 2) - 1;

    front = page - split;
    back = total - page - (fit - split) + 2;

    if (front <= 1) {
      back -= front <= 0 ? Math.abs(front) + 1 : 0;
      front = 0;
    }

    if (back <= 1) {
      front -= back <= 0 ? Math.abs(back) + 1 : 0;
      back = 0;
    }
  }

  // all enumerable items to render in between
  // overflow menus
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
        disabled="{!loop && page === 1}"
        icon="{CaretLeft}"
        on:click="{() => {
          if (page <= 1) {
            if (loop) page = total;
          } else {
            page--;
          }
          dispatch('click:button--previous', { page });
          dispatch('change', { page });
        }}"
      />
    </li>
    {#if fit > MIN || (fit <= MIN && page <= 1)}
      <PaginationItem
        page="{1}"
        active="{page === 1}"
        on:click="{() => {
          page = 1;
          dispatch('change', { page });
        }}"
      >
        {page === 1 ? "Active, Page" : "Page"}
      </PaginationItem>
    {/if}
    <PaginationOverflow
      fromIndex="{startOffset}"
      count="{front}"
      on:select="{({ detail }) => {
        page = detail.index;
        dispatch('change', { page });
      }}"
    />
    {#each items as item}
      <PaginationItem
        page="{item + 1}"
        active="{page === item + 1}"
        on:click="{() => {
          page = item + 1;
          dispatch('change', { page });
        }}"
      >
        {page === item ? "Active, Page" : "Page"}
      </PaginationItem>
    {/each}
    <PaginationOverflow
      fromIndex="{total - back - 1}"
      count="{back}"
      on:select="{({ detail }) => {
        page = detail.index;
        dispatch('change', { page });
      }}"
    />
    {#if total > 1}
      <PaginationItem
        page="{total}"
        active="{page === total}"
        on:click="{() => {
          page = total;
          dispatch('change', { page });
        }}"
      >
        {page === total ? "Active, Page" : "Page"}
      </PaginationItem>
    {/if}
    <li class:bx--pagination-nav__list-item="{true}">
      <Button
        kind="ghost"
        tooltipAlignment="center"
        tooltipPosition="bottom"
        iconDescription="{forwardText}"
        disabled="{!loop && page === total}"
        icon="{CaretRight}"
        on:click="{() => {
          if (page >= total) {
            if (loop) page = 1;
          } else {
            page++;
          }
          dispatch('click:button--next', { page });
          dispatch('change', { page });
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
