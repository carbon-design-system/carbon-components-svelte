<script>
  /** Specify the title of the data table */
  export let title = "";

  /** Specify the description of the data table */
  export let description = "";

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /**
   * Set an id for the container element.
   * The title and description ids derive from it as `{id}-title` and
   * `{id}-description`. They are read once when the component is created.
   */
  export let id = uniqueId();

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
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
  {id}
  class:bx--data-table-container={true}
  class:bx--data-table-container--static={useStaticWidth}
  class:bx--data-table--max-width={stickyHeader}
  {...$$restProps}
>
  {#if title || description}
    <div class:bx--data-table-header={true}>
      {#if title}
        <h4 id={titleId} class:bx--data-table-header__title={true}>{title}</h4>
      {/if}
      {#if description}
        <p id={descriptionId} class:bx--data-table-header__description={true}>
          {description}
        </p>
      {/if}
    </div>
  {/if}
  <slot />
</div>
