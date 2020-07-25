<script>
  export let autocomplete = "off";
  export let autofocus = false;
  export let closeButtonLabelText = "Clear search input";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let type = "text";
  export let value = "";
  export let labelText = "";
  export let placeholder = "Search...";
  export let skeleton = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to use the small variant
   * @type {boolean} [small=false]
   */
  export let small = false;
  export let size = small ? "sm" : "xl";
  export let ref = null;

  import Close16 from "carbon-icons-svelte/lib/Close16";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import Search16 from "carbon-icons-svelte/lib/Search16";
  import SearchSkeleton from "./Search.Skeleton.svelte";
</script>

{#if skeleton}
  <SearchSkeleton
    {small}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  <div
    class:bx--search={true}
    class="bx--search--{size}"
    class:bx--search--light={light}
    {...$$restProps}>
    <Search16 class="bx--search-magnifier" />
    <label class:bx--label={true} for={id}>{labelText}</label>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      bind:this={ref}
      role="searchbox"
      class:bx--search-input={true}
      {autofocus}
      {autocomplete}
      {id}
      {placeholder}
      {type}
      {value}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }} />
    <button
      type="button"
      aria-label={closeButtonLabelText}
      class:bx--search-close={true}
      class:bx--search-close--hidden={value === ''}
      on:click
      on:click={() => {
        value = '';
        ref.focus();
      }}>
      <svelte:component this={size === 'xl' ? Close20 : Close16} />
    </button>
  </div>
{/if}
