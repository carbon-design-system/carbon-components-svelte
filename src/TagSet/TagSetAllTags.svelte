<script>
  /**
   * Internal: the "View all" modal of `TagSet`, listing every tag with a
   * search field. Not exported from the package.
   *
   * @event {import("./TagSet.svelte").TagSetItem} close - A dismissible tag in the list was closed.
   */

  /**
   * Whether the modal is open.
   * @bindable writable
   */
  export let open = false;

  /**
   * The search text.
   * @bindable writable
   */
  export let query = "";

  /**
   * Obtain a reference to the tag list.
   * @bindable readonly
   * @type {null | HTMLUListElement}
   */
  export let listRef = null;

  /** @type {import("./TagSet.svelte").TagSetItem[]} */
  export let tags = [];

  /** Set to `true` to keep dismissible tags closable. */
  export let closable = false;

  /** @type {string} */
  export let title;

  /** @type {string} */
  export let searchLabel;

  /** @type {(count: number) => string} */
  export let resultsLabel;

  /** @type {"sm" | "default" | "lg" | "md" | undefined} */
  export let size = undefined;

  import { createEventDispatcher, setContext } from "svelte";
  import Modal from "../Modal/Modal.svelte";
  import Search from "../Search/Search.svelte";
  import Tag from "../Tag/Tag.svelte";

  // These tags list the set's tags; they must not register with it.
  setContext("carbon:TagSet", undefined);

  const dispatch = createEventDispatcher();
</script>

<Modal bind:open passiveModal size="sm" modalHeading={title}>
  <Search
    bind:value={query}
    labelText={searchLabel}
    placeholder={searchLabel}
    data-modal-primary-focus
  />
  <ul
    bind:this={listRef}
    class:bx--tag-set-modal__list={true}
    aria-label={title}
  >
    {#each tags as tag (tag.id)}
      <li>
        <Tag
          type={tag.type}
          filter={closable && tag.filter}
          disabled={tag.disabled}
          value={tag.value}
          {size}
          on:close={() => dispatch("close", tag)}
        >
          {tag.label}
        </Tag>
      </li>
    {/each}
  </ul>
  <p
    class:bx--tag-set-modal__results={true}
    class:bx--visually-hidden={tags.length > 0}
    role="status"
  >
    {resultsLabel(tags.length)}
  </p>
</Modal>
