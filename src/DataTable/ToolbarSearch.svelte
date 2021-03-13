<script>
  /**
   * Specify the value of the search input
   * @type {number | string}
   */
  export let value = "";

  /** Set to `true` to expand the search bar */
  export let expanded = false;

  /** Set to `true` to keep the search bar expanded */
  export let persistent = false;

  /** Set to `true` to disable the search bar */
  export let disabled = false;

  /** Specify the tabindex */
  export let tabindex = "0";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { tick } from "svelte";
  import Search from "../Search/Search.svelte";

  async function expandSearch() {
    if (disabled || persistent || expanded) return;
    expanded = true;
    await tick();
    ref.focus();
  }
</script>

<div
  tabindex="{expanded || disabled ? '-1' : tabindex}"
  class:bx--toolbar-action="{true}"
  class:bx--toolbar-search-container-active="{expanded}"
  class:bx--toolbar-search-container-expandable="{!persistent}"
  class:bx--toolbar-search-container-persistent="{persistent}"
  class:bx--toolbar-search-container-disabled="{disabled}"
  on:click="{expandSearch}"
  on:focus="{expandSearch}"
>
  <Search
    size="sm"
    tabindex="{expanded ? tabindex : '-1'}"
    disabled="{disabled}"
    {...$$restProps}
    bind:ref
    bind:value
    on:clear
    on:change
    on:input
    on:focus
    on:blur
    on:blur="{() => {
      expanded = !persistent && !!value.length;
    }}"
  />
</div>
