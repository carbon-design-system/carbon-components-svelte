<script>
  /** @restProps {input} */

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

  $: expanded = !!value.length;
  $: classes = [
    expanded && "bx--toolbar-search-container-active",
    persistent
      ? "bx--toolbar-search-container-persistent"
      : "bx--toolbar-search-container-expandable",
    disabled && "bx--toolbar-search-container-disabled",
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Search
  tabindex="{tabindex}"
  disabled="{disabled}"
  {...$$restProps}
  searchClass="{classes} {$$restProps.class}"
  bind:ref
  bind:value
  on:clear
  on:change
  on:input
  on:focus
  on:focus="{expandSearch}"
  on:blur
  on:blur="{() => {
    expanded = !persistent && !!value.length;
  }}"
/>
