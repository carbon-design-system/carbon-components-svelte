<script>
  /**
   * @generics {Result extends HeaderSearchResult = HeaderSearchResult} Result
   * @template {HeaderSearchResult} Result
   * @typedef {object} HeaderSearchResult
   * @property {string} href
   * @property {string} text
   * @property {string} [description]
   * @event {null} active
   * @event {null} inactive
   * @event {null} clear
   * @event select
   * @type {object}
   * @property {string} value
   * @property {number} selectedResultIndex
   * @property {Result} selectedResult
   * @slot {{ result: Result; index: number }}
   */

  /** Specify the search input value */
  export let value = "";

  /** Set to `true` to activate and focus the search bar */
  export let active = false;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /**
   * Render a list of search results.
   * @type {ReadonlyArray<Result>}
   */
  export let results = [];

  /** Specify the selected result index. */
  export let selectedResultIndex = 0;

  import { createEventDispatcher, tick } from "svelte";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";

  const dispatch = createEventDispatcher();

  let refSearch = null;
  let prevActive;

  function reset() {
    active = false;
    value = "";
    selectedResultIndex = 0;
  }

  function selectResult() {
    dispatch("select", { value, selectedResultIndex, selectedResult });
    reset();
  }

  $: if (active && ref) ref.focus();
  $: if (!active && ref) ref.blur();
  $: {
    if (prevActive !== undefined) {
      dispatch(active ? "active" : "inactive");
    }
    prevActive = active;
  }
  $: selectedResult = results[selectedResultIndex];
  $: selectedId = selectedResult
    ? `search-menuitem-${selectedResultIndex}`
    : undefined;
</script>

<svelte:window
  on:mouseup={({ target }) => {
    if (active && !refSearch.contains(target)) active = false;
  }}
/>

<div
  bind:this={refSearch}
  class:bx--header__search={true}
  role="search"
  class:bx--header__search--active={active}
>
  <label
    class:bx--header__search-label={true}
    for="search-input"
    id="search-label">Search</label
  >
  <div
    class:bx--header__search-menu={true}
    aria-owns="search-menu"
    aria-haspopup="menu"
  >
    <button
      type="button"
      aria-label="Search"
      aria-expanded={active}
      tabindex={active ? "-1" : "0"}
      class:bx--header-search-button={true}
      class:bx--header__action={true}
      class:bx--header-search-button--disabled={active}
      on:click={() => {
        active = true;
      }}
    >
      <IconSearch size={20} title="Search" />
    </button>
    <input
      bind:this={ref}
      type="text"
      autocomplete="off"
      placeholder="Search..."
      tabindex={active ? "0" : "-1"}
      class:bx--header__search-input={true}
      class:bx--header__search--active={active}
      {...$$restProps}
      id="search-input"
      aria-autocomplete="list"
      aria-controls="search-menu"
      aria-activedescendant={selectedId}
      bind:value
      on:change
      on:input
      on:focus
      on:blur
      on:keydown
      on:keydown={(e) => {
        switch (e.key) {
          case "Enter":
            selectResult();
            break;
          case "ArrowDown":
            e.preventDefault();
            if (selectedResultIndex === results.length - 1) {
              selectedResultIndex = 0;
            } else {
              selectedResultIndex += 1;
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            if (selectedResultIndex === 0) {
              selectedResultIndex = results.length - 1;
            } else {
              selectedResultIndex -= 1;
            }
            break;
          case "Escape":
            if (value === "") {
              // If the search bar is empty, deactivate the input.
              active = false;
            }

            // Reset the search query but keep the search bar active.
            // Do not dispatch "clear" event as that should fire only on the "x" button.
            value = "";
            selectedResultIndex = 0;
            break;
        }
      }}
      on:paste
    />
    <button
      type="button"
      aria-label="Clear search"
      tabindex={active ? "0" : "-1"}
      class:bx--header__action={true}
      class:bx--header-search-button={true}
      class:bx--header-search-button--hidden={!active}
      on:click={() => {
        reset();
        dispatch("clear");
      }}
    >
      <Close size={20} title="Close" />
    </button>
  </div>

  {#if active && results.length > 0}
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      aria-labelledby="search-label"
      role="menu"
      id="search-menu"
      class:bx--header-search-menu={true}
    >
      {#each results as result, i}
        <li role="none">
          <a
            tabindex="-1"
            id="search-menuitem-{i}"
            role="menuitem"
            href={result.href}
            class:bx--header-search-menu-item={true}
            class:bx--header-search-menu-item--selected={selectedId ===
              `search-menuitem-${i}`}
            on:click|preventDefault={async () => {
              selectedResultIndex = i;
              await tick();
              selectResult();
            }}
          >
            <slot {result} index={i}>
              {result.text}
              {#if result.description}<span
                  class:bx--header-search-menu-description={true}
                  >– {result.description}</span
                >{/if}
            </slot>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
