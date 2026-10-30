<script>
  /**
   * @template [T=any]
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @event {null} expand
   * @event {null} collapse
   * @event {T} search
   * @event {KeyboardEvent} shortcut - Dispatched when `shortcut` is pressed, before the field is focused. Call `preventDefault()` to skip the focus.
   * @restProps {input}
   */

  /**
   * Specify the value of the search input.
   * Follows the field when the owning form resets.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * Specify the size of the search input.
   * Inherits the parent `Form` size when unset, otherwise `"lg"` (40px),
   * as in Carbon v11. Also accepts Carbon v11's `"md"` (`"lg"`, 40px).
   * Carbon v11's 48px `lg` is `"xl"` here.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   * @default "lg"
   */
  export let size = undefined;

  /** Specify the class name passed to the outer div element */
  export let searchClass = "";

  /** Set to `true` to display the skeleton state  */
  export let skeleton = false;

  /** Set to `true` to disable the search input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Set to `true` to use the read-only variant.
   * The value cannot be edited or cleared, and still submits with the form.
   */
  export let readonly = false;

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

  /**
   * Specify a keyboard shortcut that focuses the field, such as `"/"` or
   * `"mod+k"`. `mod` is Command on Apple platforms and Ctrl elsewhere. The
   * keys show at the end of the empty field until it's focused, and the
   * input gets `aria-keyshortcuts`. A shortcut without a modifier, such as
   * `"/"`, doesn't fire while typing in another field.
   */
  export let shortcut = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

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
   * @type {null | HTMLInputElement}
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

  /** Specify the assistive text for the spinner shown while `loading` */
  export let loadingDescription = "Searching";

  /**
   * Milliseconds to wait after the last input before dispatching `search`.
   * 0 (default) does not dispatch on input; Enter still dispatches
   * immediately. When greater than 0, `search` also fires after the pause.
   * `value` updates immediately either way.
   */
  export let debounce = 0;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import { KBD_TRANSLATIONS, kbdKeys } from "../Kbd/kbd-keys.js";
  import { getKbdTranslations } from "../Kbd/kbd-translations.js";
  import Loading from "../Loading/Loading.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { debounce as debounceFn } from "../utils/debounce.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { returnFocus } from "../utils/focus.js";
  import { formReset } from "../utils/form-reset.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    keyboardShortcut,
  } from "../utils/keyboard-shortcut.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { normalizeSize, SEARCH_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";
  import SearchSkeleton from "./SearchSkeleton.svelte";

  const dispatch = createEventDispatcher();

  // Pressing the shortcut focuses the field, expanding it first when it's
  // collapsed (the magnifier button holds the binding then).
  /** @param {KeyboardEvent} event */
  function runShortcut(event) {
    if (!dispatch("shortcut", event, { cancelable: true })) return;
    if (expandable && !expanded) {
      expanded = true;
      tick().then(() => ref?.focus());
    } else {
      ref?.focus();
    }
  }

  const kbdTranslations = getKbdTranslations();

  /** @param {import("../Kbd/Kbd.svelte").KbdTranslationId} id */
  function translateKey(id) {
    return kbdTranslations?.(id) ?? KBD_TRANSLATIONS[id];
  }

  $: shortcutParams = { shortcut, run: runShortcut };
  // The magnifier holds the binding while the field is collapsed, so it
  // announces the keys too.
  $: ariaShortcut = shortcut
    ? ariaKeyShortcuts(shortcut, { apple: $applePlatform }) || undefined
    : undefined;
  // The keys show in the empty field, where the clear button goes, and
  // make room for themselves: their width in `ch`, near enough for the
  // short run of keys, in the names `setKbdTranslations` gives them, and
  // known on the server.
  $: hasShortcutHint =
    Boolean(shortcut) &&
    (value === "" || value == null) &&
    !disabled &&
    !(expandable && !expanded) &&
    !showInvalid &&
    !showWarn;
  $: shortcutWidth = kbdKeys(shortcut, $applePlatform, translateKey)
    .map((key) => key.label)
    .join($applePlatform ? "" : "+").length;

  let skipSelectOnFocus = false;

  /**
   * Focus the input without selecting text, even when `selectTextOnFocus` is set.
   * @returns {void}
   */
  export function focusWithoutSelect() {
    skipSelectOnFocus = true;
    ref?.focus();
  }
  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(
    size ?? $formSize ?? "lg",
    SEARCH_SIZE_ALIASES,
  );

  let searchRef = null;
  let prevExpanded = expanded;
  let dispatchSearch = null;

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

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
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: ({ errorId, warnId, helperId } = buildFieldIds(id));
  // Fluid fields render no helper text, as with the other fluid fields.
  $: describedById = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    isFluid,
    invalidText,
    warnText,
    helperText,
    errorId,
    warnId,
    helperId,
    includeErrorId: false,
  });
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
    size={effectiveSize}
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
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
    class:bx--search={true}
    class:bx--search--disabled={disabled}
    class:bx--search--xs={effectiveSize === "xs"}
    class:bx--search--sm={effectiveSize === "sm"}
    class:bx--search--lg={effectiveSize === "lg"}
    class:bx--search--xl={effectiveSize === "xl"}
    class:bx--search--expandable={expandable}
    class:bx--search--expanded={expanded}
    class:bx--search--fluid={isFluid}
    class:bx--search--shortcut={hasShortcutHint}
    style:--ccs-search-shortcut-width={hasShortcutHint
      ? `${shortcutWidth}ch`
      : undefined}
    class={searchClass}
  >
    {#if expandable && !expanded}
      <button
        type="button"
        bind:this={searchRef}
        use:keyboardShortcut={shortcutParams}
        aria-keyshortcuts={ariaShortcut}
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
          <span class:bx--search-magnifier-icon={true}>
            <Loading
              small
              withOverlay={false}
              description={loadingDescription}
            />
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
          <span class:bx--search-magnifier-icon={true}>
            <Loading
              small
              withOverlay={false}
              description={loadingDescription}
            />
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
      class:bx--visually-hidden={hideLabel}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
      use:titleWhenTruncated={{ enabled: isFluid && !$$slots.labelChildren }}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      bind:this={ref}
      use:keyboardShortcut={shortcutParams}
      use:preserveFocusSelection={selectTextOnFocus && !disabled}
      use:formReset={handleFormReset}
      bind:value
      type="search"
      class:bx--search-input={true}
      autofocus={autofocus === true ? true : undefined}
      {autocomplete}
      {disabled}
      {readonly}
      {id}
      {placeholder}
      aria-busy={loading ? "true" : undefined}
      data-invalid={showInvalid || undefined}
      aria-invalid={showInvalid ? "true" : undefined}
      data-warn={showWarn || undefined}
      aria-errormessage={showInvalid && invalidText ? errorId : undefined}
      aria-keyshortcuts={ariaShortcut}
      {...$$restProps}
      aria-describedby={joinDescribedBy(
        describedById,
        $$restProps["aria-describedby"],
      )}
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
          // Escape that cancels an IME composition is not a clear.
          if (isImeComposition(event)) return;
          if (!readonly && value !== "" && value != null) {
            value = "";
            dispatchSearch?.cancel();
            dispatch("clear");
            event.preventDefault();
          } else if (expandable && expanded) {
            expanded = false;
            event.preventDefault();
            // Collapsing makes the input inert, so focus would fall to
            // <body>. Move it to the magnifier button that replaces it.
            tick().then(() => returnFocus(searchRef, ref));
          }
        } else if (event.key === "Enter") {
          // Enter that commits an IME composition is not a search.
          if (isImeComposition(event)) return;
          event.preventDefault();
          dispatchSearch?.cancel();
          dispatch("search", value ?? "");
        }
      }}
      on:keyup
      on:paste
    />
    {#if hasShortcutHint}
      <span class:bx--search__shortcut={true}>
        <Kbd {shortcut} variant="muted" aria-hidden="true" />
      </span>
    {/if}
    {#if showInvalid}
      <WarningFilled class="bx--search__invalid-icon" />
    {/if}
    {#if showWarn}
      <WarningAltFilled
        class="bx--search__invalid-icon bx--search__invalid-icon--warning"
      />
    {/if}
    <button
      type="button"
      aria-label={closeButtonLabelText}
      {disabled}
      class:bx--search-close={true}
      class:bx--search-close--hidden={readonly || value === "" || value == null}
      on:click
      on:click={() => {
        if (readonly) return;
        value = "";
        ref.focus();
        dispatchSearch?.cancel();
        dispatch("clear");
      }}
    >
      <svelte:component this={Close} size={effectiveSize === "xl" ? 20 : 16} />
    </button>
    {#if isFluid && (showInvalid || showWarn)}
      <!-- Fluid: the message sits inside the field, under a divider, with
           the status icon beside it, as on the other fluid fields. -->
      <hr class:bx--search__divider={true} />
      {#if showInvalid}
        {#if invalidText}
          <div id={errorId} class:bx--form-requirement={true} role="alert">
            {invalidText}
          </div>
        {/if}
      {:else if warnText}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    {/if}
  </div>
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if showInvalid && !isFluid && invalidText}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if showWarn && !isFluid && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
{/if}
