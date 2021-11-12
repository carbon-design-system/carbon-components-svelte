<script>
  /**
   * @event {any} expand
   * @event {any} collapse
   */

  /**
   * @deprecated this prop will be removed in the next major release
   * Use size="sm" instead
   */
  export let small = false;

  /**
   * Specify the size of the search input
   * @type {"sm" | "lg" | "xl"} [size="xl"]
   */
  export let size = "xl";

  /** Specify the class name passed to the outer div element */
  export let searchClass = "";

  /** Set to `true` to display the skeleton state  */
  export let skeleton = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the search input */
  export let disabled = false;

  /** Set to `true` to enable the expandable variant */
  export let expandable = false;

  /** Set to `true to expand the search input */
  export let expanded = false;

  /** Specify the value of the search input */
  export let value = "";

  /** Specify the `type` attribute of the search input */
  export let type = "text";

  /** Specify the `placeholder` attribute of the search input */
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

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = Search16;

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Close16 from "../icons/Close16.svelte";
  import Close20 from "../icons/Close20.svelte";
  import Search16 from "../icons/Search16.svelte";
  import SearchSkeleton from "./SearchSkeleton.svelte";

  const dispatch = createEventDispatcher();

  let searchRef = null;

  $: if (expanded && ref) ref.focus();
  $: dispatch(expanded ? "expand" : "collapse");
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
    class:bx--search--expandable="{expandable}"
    class:bx--search--expanded="{expanded}"
    class="{searchClass}"
  >
    <div
      bind:this="{searchRef}"
      class:bx--search-magnifier="{true}"
      on:click="{() => {
        if (expandable) expanded = true;
      }}"
    >
      <svelte:component this="{icon}" class="bx--search-magnifier-icon" />
    </div>
    <label id="{id}-search" for="{id}" class:bx--label="{true}">
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
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
      on:focus="{() => {
        if (expandable) expanded = true;
      }}"
      on:blur
      on:blur="{() => {
        if (expanded && value.trim().length === 0) {
          expanded = false;
        }
      }}"
      on:keydown
      on:keydown="{({ key }) => {
        if (key === 'Escape') {
          value = '';
          dispatch('clear');
        }
      }}"
      on:keyup
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
