<script>
  /**
   * @event {null} cancel
   */

  /**
   * Override the total items selected text
   * @type {(totalSelected: number) => string}
   */
  export let formatTotalSelected = (totalSelected) =>
    `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`;

  /**
   * Use a boolean to show or hide the toolbar
   * @type {undefined | boolean}
   */
  export let active = undefined;

  /**
   * Specify the selected IDs for standalone usage.
   * This is unnecessary if using this component with `DataTable`.
   * @type {ReadonlyArray<any>}
   */
  export let selectedIds = [];

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
  } from "svelte";

  import Button from "../Button/Button.svelte";

  let batchSelectedIds = [];
  let prevActive;

  const dispatch = createEventDispatcher();

  const ctx = getContext("DataTable");

  function cancel() {
    const shouldContinue = dispatch("cancel", null, { cancelable: true });

    if (shouldContinue) {
      ctx?.resetSelectedRowIds?.();
    }
  }

  let unsubscribe;

  // Subscribe to DataTable context if available, otherwise use selectedIds prop
  if (ctx?.batchSelectedIds) {
    unsubscribe = ctx.batchSelectedIds.subscribe((value) => {
      batchSelectedIds = value;
    });
  }

  // For standalone usage, watch the selectedIds prop
  $: if (!ctx?.batchSelectedIds) {
    batchSelectedIds = selectedIds;
  }

  $: showActions = batchSelectedIds.length > 0 || active;
  $: {
    if (prevActive !== active && active === false) {
      showActions = false;
    }

    prevActive = active;
  }

  let overflowVisible = false;

  const ctxToolbar = getContext("Toolbar");
  let unsubscribeOverflow;

  if (ctxToolbar?.overflowVisible) {
    unsubscribeOverflow = ctxToolbar.overflowVisible.subscribe((value) => {
      overflowVisible = value;
    });
  }

  onMount(() => {
    return () => {
      unsubscribe?.();
      unsubscribeOverflow?.();
    };
  });

  afterUpdate(() => {
    if (active === false && showActions) {
      active = true;
    }
  });
</script>

{#if !overflowVisible}
  <div
    class:bx--batch-actions={true}
    class:bx--batch-actions--active={showActions}
    {...$$restProps}
  >
    <div class:bx--batch-summary={true}>
      <p class:bx--batch-summary__para={true}>
        <span> {formatTotalSelected(batchSelectedIds.length)} </span>
      </p>
    </div>
    <div class:bx--action-list={true}>
      <slot />
      <Button
        class="bx--batch-summary__cancel"
        tabindex={showActions ? "0" : "-1"}
        on:click={cancel}
      >
        <slot name="cancel">Cancel</slot>
      </Button>
    </div>
  </div>
{/if}
