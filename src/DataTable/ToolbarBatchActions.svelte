<script>
  /**
   * @template [Id=any]
   * @event {null} cancel
   */

  /**
   * Override the total items selected text.
   * @type {(totalSelected: number) => string}
   */
  export let formatTotalSelected = function formatTotalSelected(totalSelected) {
    return `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`;
  };

  /**
   * Use a boolean to show or hide the toolbar.
   * @type {undefined | boolean}
   */
  export let active = undefined;

  /**
   * Specify the selected IDs for standalone usage.
   * This is unnecessary if using this component with `DataTable`.
   * @type {ReadonlyArray<Id>}
   */
  export let selectedIds = [];

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import { returnFocus } from "../utils/focus.js";

  /** @type {ReadonlyArray<unknown>} */
  let batchSelectedIds = [];
  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  let prevShowActions = false;

  const dispatch = createEventDispatcher();

  const ctx = getContext("carbon:DataTable");

  function cancel() {
    const shouldContinue = dispatch("cancel", null, { cancelable: true });

    if (shouldContinue) {
      ctx?.resetSelectedRowIds?.();
    }
  }

  /** @type {undefined | (() => void)} */
  let unsubscribe;

  // Subscribe to DataTable context if available, otherwise use selectedIds prop
  if (ctx?.batchSelectedIds) {
    unsubscribe = ctx.batchSelectedIds.subscribe(
      /** @param {ReadonlyArray<unknown>} value */
      (value) => {
        batchSelectedIds = value;
      },
    );
  }

  // For standalone usage, watch the selectedIds prop
  $: if (!ctx?.batchSelectedIds) {
    batchSelectedIds = selectedIds;
  }

  $: showActions = active ?? batchSelectedIds.length > 0;
  $: inertProps = showActions ? {} : { inert: true };

  let overflowVisible = false;

  const ctxToolbar = getContext("carbon:Toolbar");
  /** @type {undefined | (() => void)} */
  let unsubscribeOverflow;

  if (ctxToolbar?.overflowVisible) {
    unsubscribeOverflow = ctxToolbar.overflowVisible.subscribe(
      /** @param {boolean} value */
      (value) => {
        overflowVisible = value;
      },
    );
  }

  $: if (ctxToolbar?.batchActionsActive) {
    ctxToolbar.batchActionsActive.set(showActions);
  }

  $: {
    if (
      prevShowActions &&
      !showActions &&
      wrapperRef?.contains(document.activeElement)
    ) {
      // The bar is about to go inert while it still contains focus (e.g.
      // Cancel was just activated). Move focus to a stable element before
      // the browser drops it to `document.body`, unless an action handler
      // moved it elsewhere in the meantime.
      tick().then(() => returnFocus(ctxToolbar?.getRef?.(), wrapperRef));
    }
    prevShowActions = showActions;
  }

  onMount(() => {
    return () => {
      unsubscribe?.();
      unsubscribeOverflow?.();
    };
  });
</script>

{#if !overflowVisible}
  <div
    bind:this={wrapperRef}
    class:bx--batch-actions={true}
    class:bx--batch-actions--active={showActions}
    {...$$restProps}
  >
    <!-- Keep the summary outside `inert`: a live region that enters or
         leaves the accessibility tree with its text is not announced. -->
    <div class:bx--batch-summary={true}>
      <p
        class:bx--batch-summary__para={true}
        aria-live="polite"
        aria-atomic="true"
      >
        <span> {formatTotalSelected(batchSelectedIds.length)} </span>
      </p>
    </div>
    <div class:bx--action-list={true} {...inertProps}>
      <slot />
      <Button
        size="default"
        class="bx--batch-summary__cancel"
        tabindex={showActions ? "0" : "-1"}
        on:click={cancel}
      >
        <slot name="cancel">Cancel</slot>
      </Button>
    </div>
  </div>
{/if}
