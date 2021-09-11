<script>
  /**
   * Override the total items selected text
   * @type {(totalSelected: number) => string}
   */
  export let formatTotalSelected = (totalSelected) =>
    `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`;

  import { onMount, getContext } from "svelte";
  import { Button } from "../Button";

  let batchSelectedIds = [];

  $: showActions = batchSelectedIds.length > 0;

  const ctx = getContext("DataTable");
  const unsubscribe = ctx.batchSelectedIds.subscribe((value) => {
    batchSelectedIds = value;
  });

  let overflowVisible = false;

  const ctxToolbar = getContext("Toolbar");
  const unsubscribeOverflow = ctxToolbar.overflowVisible.subscribe((value) => {
    overflowVisible = value;
  });

  onMount(() => {
    return () => {
      unsubscribe();
      unsubscribeOverflow();
    };
  });
</script>

{#if !overflowVisible}
  <div
    class:bx--batch-actions="{true}"
    class:bx--batch-actions--active="{showActions}"
    {...$$restProps}
  >
    <div class:bx--batch-summary="{true}">
      <p class:bx--batch-summary__para="{true}">
        <span> {formatTotalSelected(batchSelectedIds.length)} </span>
      </p>
    </div>
    <div class:bx--action-list="{true}">
      <slot />
      <Button
        class="bx--batch-summary__cancel"
        tabindex="{showActions ? '0' : '-1'}"
        on:click="{ctx.resetSelectedRowIds}"
      >
        <slot name="cancel">Cancel</slot>
      </Button>
    </div>
  </div>
{/if}
