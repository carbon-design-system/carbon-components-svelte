<script>
  /**
   * @deprecated this prop will be removed in the next major release
   * Use size="sm" instead
   * @type {boolean} [small=false]
   */
  export let small = false;

  /**
   * Specify the size of the search input
   * @type {"sm" | "lg" | "xl"} [size="xl"]
   */
  export let size = "xl";

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
   * @type {string} [value=""]
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
   * @type {"on" | "off"}
   */
  export let autocomplete = "off";

  /** Set to `true` to auto focus the search element */
  export let autofocus = false;

  /** Specify the close button label text */
  export let closeButtonLabelText = "Clear search input";

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Close16 from "carbon-icons-svelte/lib/Close16/Close16.svelte";
  import Close20 from "carbon-icons-svelte/lib/Close20/Close20.svelte";
  import Search16 from "carbon-icons-svelte/lib/Search16/Search16.svelte";
  import SearchSkeleton from "./SearchSkeleton.svelte";

  const dispatch = createEventDispatcher();
</script>

{#if skeleton}
  <SearchSkeleton
    small="{small}"
    size="{size}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <div
    role="search"
    aria-labelledby="{id}-search"
    class:bx--search="{true}"
    class:bx--search--light="{light}"
    class:bx--search--disabled="{disabled}"
    class:bx--search--sm="{size === 'sm' || small}"
    class:bx--search--lg="{size === 'lg'}"
    class:bx--search--xl="{size === 'xl'}"
  >
    <Search16 class="bx--search-magnifier" />
    <label id="{id}-search" for="{id}" class:bx--label="{true}"
      >{labelText}</label
    >
    <!-- svelte-ignore a11y-autofocus -->
    <input
      bind:this="{ref}"
      role="searchbox"
      class:bx--search-input="{true}"
      autofocus="{autofocus === true ? true : undefined}"
      autocomplete="{autocomplete}"
      disabled="{disabled}"
      id="{id}"
      placeholder="{placeholder}"
      type="{type}"
      value="{value}"
      {...$$restProps}
      on:change
      on:input
      on:input="{({ target }) => {
        value = target.value;
      }}"
      on:focus
      on:blur
      on:keydown
      on:keydown="{({ key }) => {
        if (key === 'Escape') {
          value = '';
          dispatch('clear');
        }
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
        dispatch('clear');
      }}"
    >
      <svelte:component this="{size === 'xl' ? Close20 : Close16}" />
    </button>
  </div>
{/if}
