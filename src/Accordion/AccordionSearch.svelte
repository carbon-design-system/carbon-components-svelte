<script>
  /**
   * @typedef {Object} AccordionSearchItem
   * @property {string | number} id - Stable identity, used as the `{#each}` key.
   * @property {string} title - Matched against `filterText` and rendered as the item's title.
   * @property {string} [description] - Rendered as the item's default panel content, when no default slot is provided.
   * @property {boolean} [open] - Initial open state for this item.
   * @property {boolean} [disabled] - Disables this specific item.
   */

  /**
   * @slot {{ item: AccordionSearchItem }} - Per-item panel content. Falls back to `item.description`.
   */

  /**
   * Items to search and render as accordion sections.
   * @type {ReadonlyArray<AccordionSearchItem>}
   */
  export let items = [];

  /**
   * The current filter query.
   * @bindable writable
   */
  export let filterText = "";

  /** Placeholder for the filter input. */
  export let placeholder = "Filter items";

  /** Accessible label for the filter input. */
  export let labelText = "";

  /** Rendered instead of the accordion when no item matches `filterText`. */
  export let emptyText = "No items match your search.";

  /** Debounce (ms) for the filter input, forwarded to `Search`. */
  export let debounce = 0;

  /**
   * Specify alignment of accordion item chevron icon.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Specify the size of the accordion.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to remove the gutter around the accordion. */
  export let flush = false;

  /**
   * Specify the expansion behavior of the accordion.
   * @type {"single" | "multiple"}
   */
  export let type = "multiple";

  /** Set to `true` to disable the whole accordion. */
  export let disabled = false;

  import Search from "../Search/Search.svelte";
  import Stack from "../Stack/Stack.svelte";
  import { fuzzyMatch } from "../utils/fuzzy-match.js";
  import Accordion from "./Accordion.svelte";
  import AccordionItem from "./AccordionItem.svelte";

  $: filteredItems = items.filter(
    (item) => fuzzyMatch(item.title, filterText).matched,
  );
</script>

<Stack gap={5}>
  <Search bind:value={filterText} {placeholder} {labelText} {debounce} />
  {#if filteredItems.length === 0}
    <p>{emptyText}</p>
  {:else}
    <Accordion {align} {size} {flush} {type} {disabled}>
      {#each filteredItems as item (item.id)}
        <AccordionItem
          title={item.title}
          open={item.open}
          disabled={item.disabled}
        >
          <slot {item}>{item.description ?? ""}</slot>
        </AccordionItem>
      {/each}
    </Accordion>
  {/if}
</Stack>
