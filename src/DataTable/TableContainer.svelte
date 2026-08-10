<script>
  /** Specify the title of the data table */
  export let title = "";

  /** Specify the description of the data table */
  export let description = "";

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { uniqueId } from "../utils/uniqueId.js";

  const titleId = uniqueId();
  const descriptionId = uniqueId();
  const hasTitle = writable(!!title);
  const hasDescription = writable(!!description);

  $: hasTitle.set(!!title);
  $: hasDescription.set(!!description);

  setContext("carbon:TableContainer", {
    titleId,
    descriptionId,
    hasTitle,
    hasDescription,
  });
</script>

<div
  class:bx--data-table-container={true}
  class:bx--data-table-container--static={useStaticWidth}
  class:bx--data-table--max-width={stickyHeader}
  {...$$restProps}
>
  {#if title}
    <div class:bx--data-table-header={true}>
      <h4 id={titleId} class:bx--data-table-header__title={true}>{title}</h4>
      <p id={descriptionId} class:bx--data-table-header__description={true}>
        {description}
      </p>
    </div>
  {/if}
  <slot />
</div>
