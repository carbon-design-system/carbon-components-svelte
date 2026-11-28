<script>
  /**
   * The inside of `SelectionBar`, shared by its animated and still branches.
   * @event {null} clear
   * @slot {{}} actions
   * @slot {{}} items
   */

  /** @type {string} */
  export let summaryId;

  /** @type {string} */
  export let text;

  /** @type {string} */
  export let clearText;

  export let hasItems = false;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();
</script>

<div class:bx--selection-bar__bar={true}>
  <p
    id={summaryId}
    dir="auto"
    class:bx--batch-summary__para={true}
    class:bx--selection-bar__summary={true}
  >
    {text}
  </p>
  <div class:bx--action-list={true}>
    <slot name="actions" />
    <Button
      size="default"
      class="bx--batch-summary__cancel"
      on:click={() => dispatch("clear")}
    >
      {clearText}
    </Button>
  </div>
</div>
{#if hasItems}
  <div class:bx--selection-bar__items={true}>
    <slot name="items" />
  </div>
{/if}
