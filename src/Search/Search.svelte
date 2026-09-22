<script>
  /**
   * @template [T=any]
   * @template [Icon=any]
   * @event {null} expand
   * @event {null} collapse
   * @event {T} search
   * @restProps {input}
   */

  /**
   * Specify the value of the search input.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * Specify the size of the search input.
   * @type {"xs" | "sm" | "lg" | "xl"}
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

  /**
   * Set to `true to expand the search input.
   * @bindable writable
   */
  export let expanded = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the expandable variant.
   */
  export let fluid = false;

  /** Specify the `placeholder` attribute of the search input */
  export let placeholder = "Search...";

  /**
   * Specify the `autocomplete` attribute.
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
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (IconSearch);

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  /**
   * Set to `true` while results are loading. Shows a small spinner in place
   * of the search icon and sets `aria-busy` on the input. The field stays
   * editable.
   */
  export let loading = false;

  /**
   * Milliseconds to wait after the last input before dispatching `search`.
   * 0 (default) does not dispatch on input; Enter still dispatches
   * immediately. When greater than 0, `search` also fires after the pause.
   * `value` updates immediately either way.
   */
  export let debounce = 0;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import Loading from "../Loading/Loading.svelte";
  import { debounce as debounceFn } from "../utils/debounce.js";
  import { uniqueId } from "../utils/unique-id.js";
  import SearchSkeleton from "./SearchSkeleton.svelte";

  const dispatch = createEventDispatcher();

  let skipSelectOnFocus = false;

  /** Focus the input without selecting text, even when `selectTextOnFocus` is set. */
  export function focusWithoutSelect() {
    skipSelectOnFocus = true;
    ref?.focus();
  }
  const formContext = getContext("carbon:Form");

  let searchRef = null;
  let prevExpanded = expanded;
  let dispatchSearch = null;

  $: {
    dispatchSearch?.cancel();
    dispatchSearch =
      debounce > 0
        ? debounceFn(
            (searchValue) => dispatch("search", searchValue ?? ""),
            debounce,
          )
        : null;
  }

  onMount(() => {
    return () => dispatchSearch?.cancel();
  });

  $: isFluid = !expandable && (fluid || !!formContext?.isFluid);
  $: if (expanded && ref) {
    tick().then(() => {
      if (expanded) ref?.focus();
    });
  }
  $: if (expanded !== prevExpanded) {
    const nextExpanded = expanded;
    prevExpanded = expanded;
    dispatch(nextExpanded ? "expand" : "collapse");
  }
</script>

<!-- svelte-ignore a11y-autofocus -->
{#if skeleton}
  <SearchSkeleton
    {size}
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
    class:bx--search={true}
    class:bx--search--light={light}
    class:bx--search--disabled={disabled}
    class:bx--search--xs={size === "xs"}
    class:bx--search--sm={size === "sm"}
    class:bx--search--lg={size === "lg"}
    class:bx--search--xl={size === "xl"}
    class:bx--search--expandable={expandable}
    class:bx--search--expanded={expanded}
    class:bx--search--fluid={isFluid}
    class={searchClass}
  >
    {#if expandable && !expanded}
      <button
        type="button"
        bind:this={searchRef}
        class:bx--search-magnifier={true}
        aria-label={labelText.trim() === ""
          ? placeholder || "Open search"
          : labelText}
        {disabled}
        on:click={() => {
          expanded = true;
        }}
      >
        {#if loading}
          <span class="bx--search-magnifier-icon">
            <Loading small withOverlay={false} description="Searching" />
          </span>
        {:else}
          <svelte:component this={icon} class="bx--search-magnifier-icon" />
        {/if}
      </button>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={searchRef}
        class:bx--search-magnifier={true}
        on:click={() => {
          if (expandable && !disabled) expanded = true;
        }}
      >
        {#if loading}
          <span class="bx--search-magnifier-icon">
            <Loading small withOverlay={false} description="Searching" />
          </span>
        {:else}
          <svelte:component this={icon} class="bx--search-magnifier-icon" />
        {/if}
      </div>
    {/if}
    <label
      id="{id}-search"
      for={id}
      class:bx--label={true}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      bind:this={ref}
      bind:value
      type="search"
      class:bx--search-input={true}
      autofocus={autofocus === true ? true : undefined}
      {autocomplete}
      {disabled}
      {id}
      {placeholder}
      aria-busy={loading || undefined}
      {...$$restProps}
      tabindex={expandable && !expanded ? -1 : $$restProps.tabindex}
      inert={expandable && !expanded ? true : $$restProps.inert}
      on:change
      on:input
      on:input={() => {
        dispatchSearch?.(value);
      }}
      on:focus
      on:focus={() => {
        if (expandable && !disabled) expanded = true;
        const skip = skipSelectOnFocus;
        skipSelectOnFocus = false;
        if (selectTextOnFocus && !disabled && !skip) {
          tick().then(() => ref?.select());
        }
      }}
      on:blur
      on:blur={() => {
        if (expanded && (value === "" || value == null)) {
          expanded = false;
        }
      }}
      on:keydown
      on:keydown={(event) => {
        if (event.key === "Escape") {
          if (value !== "" && value != null) {
            value = "";
            dispatchSearch?.cancel();
            dispatch("clear");
            event.preventDefault();
          } else if (expandable && expanded) {
            expanded = false;
            event.preventDefault();
          }
        } else if (event.key === "Enter") {
          event.preventDefault();
          dispatchSearch?.cancel();
          dispatch("search", value ?? "");
        }
      }}
      on:keyup
      on:paste
    >
    <button
      type="button"
      aria-label={closeButtonLabelText}
      {disabled}
      class:bx--search-close={true}
      class:bx--search-close--hidden={value === "" || value == null}
      on:click
      on:click={() => {
        value = "";
        ref.focus();
        dispatchSearch?.cancel();
        dispatch("clear");
      }}
    >
      <svelte:component this={Close} size={size === "xl" ? 20 : 16} />
    </button>
  </div>
{/if}
