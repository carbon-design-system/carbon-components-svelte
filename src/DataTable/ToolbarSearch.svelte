<script>
  /**
   * Specify the value of the search input
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Set to `true` to expand the search bar
   * @type {boolean} [expanded=false]
   */
  export let expanded = false;

  /**
   * Set to `true` to keep the search bar expanded
   * @type {boolean} [persistent=false]
   */
  export let persistent = false;

  /**
   * Specify the tabindex
   * @type {string} [tabindex="0"]
   */
  export let tabindex = "0";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

  import { tick } from "svelte";
  import { Search } from "../Search";

  async function expandSearch() {
    if (persistent || expanded) return;
    expanded = true;
    await tick();
    ref.focus();
  }
</script>

<div
  tabindex="{expanded ? '-1' : tabindex}"
  class:bx--toolbar-action="{true}"
  class:bx--toolbar-search-container-active="{expanded}"
  class:bx--toolbar-search-container-expandable="{!persistent}"
  class:bx--toolbar-search-container-persistent="{persistent}"
  on:click="{expandSearch}"
  on:focus="{expandSearch}"
>
  <Search
    size="sm"
    tabindex="{expanded ? tabindex : '-1'}"
    aria-hidden="{!expanded}"
    {...$$restProps}
    bind:ref
    bind:value
    on:change
    on:input
    on:focus
    on:blur
    on:blur="{() => {
      expanded = !persistent && !!value.length;
    }}"
  />
</div>
