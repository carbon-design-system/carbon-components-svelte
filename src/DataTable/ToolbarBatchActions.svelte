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

  import {
    onMount,
    getContext,
    createEventDispatcher,
    afterUpdate,
  } from "svelte";

  import Button from "../Button/Button.svelte";

  let batchSelectedIds = [];
  let prevActive;

  const dispatch = createEventDispatcher();

  const ctx = getContext("DataTable");

  function cancel() {
    const shouldContinue = dispatch("cancel", null, { cancelable: true });

    if (shouldContinue) {
      ctx.resetSelectedRowIds();
    }
  }

  $: showActions = batchSelectedIds.length > 0 || active;
  $: {
    if (prevActive !== active && active === false) {
      showActions = false;
    }

    prevActive = active;
  }

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

  afterUpdate(() => {
    if (active === false && showActions) {
      active = true;
    }
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
        on:click="{cancel}"
      >
        <slot name="cancel">Cancel</slot>
      </Button>
    </div>
  </div>
{/if}
