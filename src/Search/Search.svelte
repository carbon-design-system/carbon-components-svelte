<script>
  /**
   * Set to `true` to use the small variant
   * @type {boolean} [small=false]
   */
  export let small = false;

  /**
   * Specify the size of the search input
   * @type {"sm" | "lg"} [size]
   */
  export let size = small ? "sm" : "xl";

  /**
   * Set to `true` to display the skeleton state
   * @type {boolean} [skeleton=false]
   */
  export let skeleton = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to disable the search input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the value of the search input
   * @type {string} [value="text"]
   */
  export let value = "";

  /**
   * Specify the `type` attribute of the search input
   * @type {string} [type="text"]
   */
  export let type = "text";

  /**
   * Specify the `placeholder` attribute of the search input
   * @type {string} [placeholder="Search..."]
   */
  export let placeholder = "Search...";

  /**
   * Specify the `autocomplete` attribute
   * @type {"on" | "off"} [autocomplete="off"]
   */
  export let autocomplete = "off";

  /**
   * Set to `true` to auto focus the search element
   * @type {boolean} [autofocus=false]
   */
  export let autofocus = false;

  /**
   * Specify the close button label text
   * @type {string} [closeButtonLabelText="Clear search input"]
   */
  export let closeButtonLabelText = "Clear search input";

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

  import Close16 from "carbon-icons-svelte/lib/Close16";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import Search16 from "carbon-icons-svelte/lib/Search16";
  import SearchSkeleton from "./Search.Skeleton.svelte";
</script>

{#if skeleton}
  <SearchSkeleton
    small="{small}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <div
    class:bx--search="{true}"
    class:bx--search--light="{light}"
    class:bx--search--disabled="{disabled}"
    {...$$restProps}
    class="bx--search--{size} {$$restProps.class}"
  >
    <Search16 class="bx--search-magnifier" />
    <label for="{id}" class:bx--label="{true}">{labelText}</label>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      bind:this="{ref}"
      role="searchbox"
      class:bx--search-input="{true}"
      autofocus="{autofocus}"
      autocomplete="{autocomplete}"
      disabled="{disabled}"
      id="{id}"
      placeholder="{placeholder}"
      type="{type}"
      value="{value}"
      on:change
      on:input
      on:input="{({ target }) => {
        value = target.value;
      }}"
    />
    <button
      type="button"
      aria-label="{closeButtonLabelText}"
      disabled="{disabled}"
      class:bx--search-close="{true}"
      class:bx--search-close--hidden="{value === ''}"
      on:click
      on:click="{() => {
        value = '';
        ref.focus();
      }}"
    >
      <svelte:component this="{size === 'xl' ? Close20 : Close16}" />
    </button>
  </div>
{/if}
