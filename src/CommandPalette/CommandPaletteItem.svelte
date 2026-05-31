<script>
  /**
   * @event {{ value: string; item: { text?: string; value?: string; href?: string; description?: string; keywords?: string[]; shortcut?: string[]; shortcutKeys?: string | string[]; selectionMode?: string; selected?: boolean }; event: Event }} select
   * @slot {{ query: string; matched: boolean; indices: number[]; segments: Array<{ text: string; match: boolean }>; active: boolean }}
   */

  /**
   * Specify the command label. The portion matching the search value is highlighted.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the value emitted on selection. Defaults to `text`.
   * @type {string | undefined}
   */
  export let value = undefined;

  /** Specify secondary text shown below the label */
  export let description = undefined;

  /** Extra search terms matched during filtering but not shown */
  export let keywords = undefined;

  /**
   * Render the item as a link with this `href`.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the icon rendered in the magnifier gutter.
   * @type {any}
   */
  export let icon = undefined;

  /** Display badges for a keyboard shortcut, e.g. ["⌘", "N"] */
  export let shortcut = undefined;

  /**
   * Machine-readable shortcut combos when display text cannot parse.
   * @type {string | string[] | undefined}
   */
  export let shortcutKeys = undefined;

  /** Called after select unless prevented */
  export let run = undefined;

  /** Set to `true` to disable the item */
  export let disabled = false;

  /** Set to `true` to always render the item, bypassing fuzzy filtering */
  export let persistent = false;

  /**
   * Override whether this item is filtered by the search value.
   * @type {boolean | undefined}
   */
  export let filter = undefined;

  /**
   * Render a radio or checkbox control.
   * @type {"single" | "multiple" | undefined}
   */
  export let selectionMode = undefined;

  /** Selected state for selection controls (consumer-controlled) */
  export let selected = false;

  /** Set an id for the item element */
  export let id = `ccs-${Math.random().toString(36)}`;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { highlightSegments } from "../utils/fuzzyMatch.js";

  const dispatch = createEventDispatcher();
  const menu = getContext("carbon:CommandPalette");
  const group = getContext("carbon:CommandPaletteGroup");

  if (!menu) {
    throw new Error("CommandPaletteItem must be used within a CommandPalette.");
  }

  const queryStore = menu.query;
  const shouldFilterStore = menu.shouldFilter;
  const matchStore = menu.match;
  const activeIdStore = menu.activeId;
  const highlightMatchesStore = menu.highlightMatches;
  const groupFilterStore = group?.filter ?? readable(undefined);

  let ref = null;
  let registered = false;

  $: effectiveFilter = filter ?? $groupFilterStore ?? $shouldFilterStore;
  $: textMatch = text
    ? normalizeMatch($matchStore(text, $queryStore))
    : { matched: true, indices: [] };
  $: descriptionMatch = description
    ? normalizeMatch($matchStore(description, $queryStore))
    : { matched: false, indices: [] };
  $: keywordMatch = (keywords ?? []).some(
    (keyword) => normalizeMatch($matchStore(keyword, $queryStore)).matched,
  );
  $: isFilterable = Boolean(text) && effectiveFilter && !persistent;
  $: shouldRender =
    !text ||
    persistent ||
    !effectiveFilter ||
    textMatch.matched ||
    descriptionMatch.matched ||
    keywordMatch;
  $: highlighted = $activeIdStore === id;
  $: segments = text ? highlightSegments(text, textMatch.indices) : [];
  $: descriptionSegments = description
    ? highlightSegments(description, descriptionMatch.indices)
    : [];
  $: labelHtml = text && $highlightMatchesStore ? segmentsToHtml(segments) : "";
  $: descriptionHtml =
    description && $highlightMatchesStore
      ? segmentsToHtml(descriptionSegments)
      : "";

  $: inDividerGroup = group?.divider ?? false;
  $: updateRegistration(shouldRender, isFilterable, inDividerGroup);

  function updateRegistration(render, filterable, footerGroup) {
    if (render) {
      registered = true;
      menu.registerItem(id, {
        filterable,
        inDividerGroup: footerGroup,
        disabled,
        shortcut,
        shortcutKeys,
        selectionMode,
        run,
        select: (event) => handleSelect(event, "select"),
        selectShortcut: (event) => handleSelect(event, "shortcut-key"),
      });
      group?.registerItem(id);
    } else if (registered) {
      registered = false;
      menu.unregisterItem(id);
      group?.unregisterItem(id);
    }
  }

  onMount(() => () => updateRegistration(false, false, false));

  function normalizeMatch(result) {
    return {
      matched: Boolean(result?.matched),
      indices: result?.indices ?? [],
    };
  }

  function escapeHtml(raw) {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function segmentsToHtml(parts) {
    return parts
      .map((part) =>
        part.match
          ? `<strong class="bx--cmd-palette__option-match">${escapeHtml(part.text)}</strong>`
          : escapeHtml(part.text),
      )
      .join("");
  }

  function handleSelect(event, closeTrigger = "select") {
    if (disabled) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
    const detail = {
      value: value ?? text ?? "",
      item: {
        text,
        value: value ?? text,
        href,
        description,
        keywords,
        shortcut,
        shortcutKeys,
        selectionMode,
        selected,
      },
      event,
    };
    dispatch("select", detail);
    menu.selectItem(detail, closeTrigger, run);
  }

  $: if (highlighted && ref && !ref.matches(":hover")) {
    ref.scrollIntoView({ block: "nearest" });
  }
</script>

{#if shouldRender}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <li
    bind:this={ref}
    {id}
    role="option"
    aria-selected={selectionMode ? selected : undefined}
    aria-disabled={disabled || undefined}
    class:bx--cmd-palette__option={true}
    class:bx--cmd-palette__option--active={highlighted}
    class:bx--cmd-palette__option--selected={selected}
    class:bx--cmd-palette__option--disabled={disabled}
    class:bx--cmd-palette__option--with-description={Boolean(description)}
    class:bx--cmd-palette__option--with-icon={Boolean(icon)}
    class:bx--cmd-palette__option--with-selection={Boolean(selectionMode)}
    {...$$restProps}
    on:click
    on:click={handleSelect}
    on:mouseenter={() => {
      if (!disabled) menu.setActiveId(id);
    }}
  >
    {#if selectionMode}
      <span class:bx--cmd-palette__option-selection={true} aria-hidden="true">
        <span
          class:bx--cmd-palette__control={true}
          class:bx--cmd-palette__control--radio={selectionMode === "single"}
          class:bx--cmd-palette__control--checkbox={selectionMode === "multiple"}
          class:bx--cmd-palette__control--checked={selected}
        ></span>
      </span>
    {/if}

    {#if icon}
      <span class:bx--cmd-palette__option-icon={true} aria-hidden="true">
        <svelte:component this={icon} />
      </span>
    {/if}

    <span class:bx--cmd-palette__option-content={true}>
      <span class:bx--cmd-palette__option-text={true}>
        {#if $$slots.default}
          <slot
            query={$queryStore}
            matched={textMatch.matched ||
              descriptionMatch.matched ||
              keywordMatch}
            indices={textMatch.indices}
            {segments}
            active={highlighted}
          />
        {:else if $highlightMatchesStore && $queryStore.trim()}
          {@html labelHtml}
        {:else}
          {text}
        {/if}
      </span>
      {#if description}
        <span class:bx--cmd-palette__option-description={true}>
          {#if $highlightMatchesStore && $queryStore.trim()}
            {@html descriptionHtml}
          {:else}
            {description}
          {/if}
        </span>
      {/if}
    </span>

    {#if shortcut && shortcut.length > 0}
      <span class:bx--cmd-palette__option-shortcut={true}>
        {#each shortcut as key, index (index)}
          <kbd class:bx--cmd-palette__key={true}>{key}</kbd>
        {/each}
      </span>
    {/if}
  </li>
{/if}
