<script>
  /**
   * @template {HeaderSearchResult} [Result=HeaderSearchResult]
   * @template [Icon=any]
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * @typedef {object} HeaderSearchResult
   * @property {string | number} [id] - Unique result identifier; used as the each-block key when provided
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
   * @slot {{ result: Result; index: number; selected: boolean; }}
   */

  /**
   * Specify the search input value.
   * @bindable writable
   */
  export let value = "";

  /**
   * Set to `true` to activate and focus the search bar.
   * @bindable writable
   */
  export let active = false;

  /**
   * Obtain a reference to the input HTML element.
   * @type {HTMLInputElement | null}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Render a list of search results.
   * @type {ReadonlyArray<Result>}
   */
  export let results = [];

  /**
   * Specify the selected result index.
   * @bindable readonly
   */
  export let selectedResultIndex = 0;

  /**
   * Specify the icon to render for the search trigger.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (IconSearch);

  import { createEventDispatcher, tick } from "svelte";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  const id = `ccs-${Math.random().toString(36)}`;
  const inputId = `${id}-input`;
  const labelId = `${id}-label`;
  const menuId = `${id}-menu`;

  /** @type {null | HTMLDivElement} */
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
    dispatch("close", { trigger: "select" });
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
    ? `${id}-menuitem-${selectedResult.id ?? selectedResultIndex}`
    : undefined;

  function handleOutsideMouseup(event) {
    if (active && isOutsideClick(event, refSearch)) {
      active = false;
      dispatch("close", { trigger: "outside-click" });
    }
  }
</script>

<div
  bind:this={refSearch}
  use:dismiss={{ enabled: active, type: "mouseup", handler: handleOutsideMouseup }}
  class:bx--header__search={true}
  role="search"
  class:bx--header__search--active={active}
>
  <label class:bx--header__search-label={true} for={inputId} id={labelId}
    >Search</label
  >
  <div
    class:bx--header__search-menu={true}
    aria-owns={menuId}
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
      <svelte:component this={icon} size={20} title="Search" />
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
      id={inputId}
      aria-autocomplete="list"
      aria-controls={menuId}
      aria-activedescendant={selectedId}
      bind:value
      on:change
      on:input
      on:focus
      on:blur
      on:keydown
      on:keydown={(event) => {
        switch (event.key) {
          case "Enter":
            selectResult();
            break;
          case "ArrowDown":
            event.preventDefault();
            if (selectedResultIndex === results.length - 1) {
              selectedResultIndex = 0;
            } else {
              selectedResultIndex += 1;
            }
            break;
          case "ArrowUp":
            event.preventDefault();
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
              dispatch("close", { trigger: "escape-key" });
            }

            // Reset the search query but keep the search bar active.
            // Do not dispatch "clear" event as that should fire only on the "x" button.
            value = "";
            selectedResultIndex = 0;
            break;
        }
      }}
      on:paste
    >
    {#if active}
      <button
        type="button"
        aria-label="Clear search"
        tabindex="0"
        class:bx--header__action={true}
        class:bx--header-search-button={true}
        on:click={() => {
          reset();
          dispatch("clear");
        }}
      >
        <Close size={20} title="Close" />
      </button>
    {/if}
  </div>

  {#if active && results.length > 0}
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      aria-labelledby={labelId}
      role="menu"
      id={menuId}
      class:bx--header-search-menu={true}
    >
      {#each results as result, index (result.id ?? index)}
        <li role="none">
          <a
            tabindex="-1"
            id="{id}-menuitem-{result.id ?? index}"
            role="menuitem"
            href={result.href}
            class:bx--header-search-menu-item={true}
            class:bx--header-search-menu-item--selected={selectedId ===
              `${id}-menuitem-${result.id ?? index}`}
            on:click|preventDefault={async () => {
              selectedResultIndex = index;
              await tick();
              selectResult();
            }}
          >
            <slot {result} {index} selected={selectedResultIndex === index}>
              {result.text}
              {#if result.description}
                <span class:bx--header-search-menu-description={true}
                  >– {result.description}</span
                >
              {/if}
            </slot>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
