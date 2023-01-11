<script>
  /**
   * @typedef {{ href: string; text: string; description?: string; }} HeaderSearchResult
   * @event {null} active
   * @event {null} inactive
   * @event {null} clear
   * @event {{ value: string; selectedResultIndex: number; selectedResult: HeaderSearchResult }} select
   * @slot {{ result: HeaderSearchResult; index: number }}
   */

  /** Specify the search input value */
  export let value = "";

  /** Set to `true` to activate and focus the search bar */
  export let active = false;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /**
   * Render a list of search results
   * @type {ReadonlyArray<HeaderSearchResult>}
   */
  export let results = [];

  /** Specify the selected result index */
  export let selectedResultIndex = 0;

  import { createEventDispatcher, tick } from "svelte";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";

  const dispatch = createEventDispatcher();

  let refSearch = null;

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
  $: dispatch(active ? "active" : "inactive");
  $: selectedResult = results[selectedResultIndex];
  $: selectedId = selectedResult
    ? `search-menuitem-${selectedResultIndex}`
    : undefined;
</script>

<svelte:window
  on:mouseup="{({ target }) => {
    if (active && !refSearch.contains(target)) active = false;
  }}"
/>

<div bind:this="{refSearch}" role="search" class:active>
  <label for="search-input" id="search-label">Search</label>
  <div aria-owns="search-menu" aria-haspopup="menu">
    <button
      type="button"
      aria-label="Search"
      aria-expanded="{active}"
      tabindex="{active ? '-1' : '0'}"
      class:bx--header__action="{true}"
      class:disabled="{active}"
      on:click="{() => {
        active = true;
      }}"
    >
      <IconSearch size="{20}" title="Search" />
    </button>
    <input
      bind:this="{ref}"
      type="text"
      autocomplete="off"
      placeholder="Search..."
      tabindex="{active ? '0' : '-1'}"
      class:active
      {...$$restProps}
      id="search-input"
      aria-autocomplete="list"
      aria-controls="search-menu"
      aria-activedescendant="{selectedId}"
      bind:value
      on:change
      on:input
      on:focus
      on:blur
      on:keydown
      on:keydown="{(e) => {
        switch (e.key) {
          case 'Enter':
            selectResult();
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (selectedResultIndex === results.length - 1) {
              selectedResultIndex = 0;
            } else {
              selectedResultIndex += 1;
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (selectedResultIndex === 0) {
              selectedResultIndex = results.length - 1;
            } else {
              selectedResultIndex -= 1;
            }
            break;
        }
      }}"
      on:paste
    />
    <button
      type="button"
      aria-label="Clear search"
      tabindex="{active ? '0' : '-1'}"
      class:bx--header__action="{true}"
      class:hidden="{!active}"
      on:click="{() => {
        reset();
        dispatch('clear');
      }}"
    >
      <Close size="{20}" title="Close" />
    </button>
  </div>

  {#if active && results.length > 0}
    <ul aria-labelledby="search-label" role="menu" id="search-menu">
      {#each results as result, i}
        <li role="none">
          <a
            tabindex="-1"
            id="search-menuitem-{i}"
            role="menuitem"
            href="{result.href}"
            class:selected="{selectedId === `search-menuitem-${i}`}"
            on:click|preventDefault="{async () => {
              selectedResultIndex = i;
              await tick();
              selectResult();
            }}"
          >
            <slot result="{result}" index="{i}">
              {result.text}
              {#if result.description}<span>– {result.description}</span>{/if}
            </slot>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  label {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    border: 0;
    visibility: inherit;
    clip: rect(0, 0, 0, 0);
  }

  [role="search"] {
    position: relative;
    display: flex;
    max-width: 28rem;
    width: 100%;
    margin-left: 0.5rem;
    height: 3rem;
    background-color: #393939;
    color: #fff;
    transition: max-width 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      background 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  [role="search"]:not(.active) {
    max-width: 3rem;
    background-color: #161616;
  }

  [role="search"].active {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }

  [aria-haspopup="menu"] {
    display: flex;
    flex-grow: 1;
    border-bottom: 1px solid #393939;
  }

  input {
    width: 100%;
    height: 3rem;
    padding: 0;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.375rem;
    letter-spacing: 0;
    color: #fff;
    caret-color: #fff;
    background-color: initial;
    border: none;
    outline: none;
    transition: opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  input:not(.active) {
    opacity: 0;
    pointer-events: none;
  }

  button {
    width: 3rem;
    height: 100%;
    padding: 0;
    flex-shrink: 0;
    opacity: 1;
    transition: background-color 0.11s cubic-bezier(0.2, 0, 0.38, 0.9),
      opacity 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .disabled {
    border: none;
    pointer-events: none;
  }

  [aria-label="Clear search"]:hover {
    background-color: #4c4c4c;
  }

  .hidden {
    opacity: 0;
    display: none;
  }

  ul {
    position: absolute;
    z-index: 10000;
    padding: 1rem 0;
    left: 0;
    right: 0;
    top: 3rem;
    background-color: #161616;
    border: 1px solid #393939;
    border-top: none;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.5);
  }

  [role="menuitem"] {
    padding: 6px 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.29;
    letter-spacing: 0.16px;
    transition: all 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
    display: block;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #c6c6c6;
  }

  .selected,
  [role="menuitem"]:hover {
    background-color: #353535;
    color: #f4f4f4;
  }

  [role="menuitem"] span {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.34;
    letter-spacing: 0.32px;
    text-transform: lowercase;
    color: #c6c6c6;
  }
</style>
