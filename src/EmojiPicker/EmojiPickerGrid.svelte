<script>
  /**
   * Internal. The `PickerGrid` of `EmojiPicker`, with its cells drawn from
   * emoji, a skin tone selector under it, and the frequently used emoji.
   * @extendProps {"../PickerGrid/PickerGrid.svelte"} PickerGridProps
   * @event {{ id: string; item: import("./emoji-items.js").EmojiPickerItem; emoji: string; selected: boolean; }} select
   */

  /**
   * @type {ReadonlyArray<import("./emoji-items.js").EmojiPickerItem>}
   */
  export let emoji = [];

  /** @type {"single" | "multiple"} */
  export let selectionMode = "single";

  /** @type {string | undefined} */
  export let value = undefined;

  /** @type {ReadonlyArray<string>} */
  export let values = [];

  /** @type {0 | 1 | 2 | 3 | 4 | 5} */
  export let skinTone = 0;

  /** @type {ReadonlyArray<string>} */
  export let recent = [];

  /** @type {Record<string, number>} */
  export let usage = {};

  export let recentLimit = 16;

  /** @type {number | undefined} */
  export let maxVersion = undefined;

  /** @type {string} */
  export let skinToneLabelText = "Skin tone";

  /** @type {ReadonlyArray<string>} */
  export let skinToneNames;

  /** @type {string} */
  export let query = "";

  /** @type {() => void} */
  export function focus() {
    gridRef?.focus();
  }

  /** @type {() => void} */
  export function reset() {
    refreshFrequent();
    gridRef?.reset();
  }

  /** The hand each skin tone button shows. It takes a tone, and draws as one glyph everywhere. */
  const TONE_SAMPLE = "\u270B";
  const TONES = [0, 1, 2, 3, 4, 5];

  import { createEventDispatcher, onMount, tick } from "svelte";
  import PickerGrid from "../PickerGrid/PickerGrid.svelte";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { applySkinTone, frequentIds, recordEmojiUse } from "./emoji-items.js";
  import {
    detectEmojiSupport,
    filterSupported,
    FULL_EMOJI_SUPPORT,
  } from "./emoji-support.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const fallbackId = uniqueId();
  // Derived from the grid's id, so a server and a client write the same one.
  $: toneLabelId = `${$$restProps.id ?? fallbackId}-tones`;

  /** @type {null | PickerGrid<import("./emoji-items.js").EmojiPickerItem>} */
  let gridRef = null;
  /** @type {null | HTMLDivElement} */
  let tonesRef = null;
  let mounted = false;
  let support = FULL_EMOJI_SUPPORT;
  /** @type {unknown} */
  let probed;
  /** @type {ReadonlyArray<string>} */
  let shownFrequent = frequentIds({ recent, usage, limit: recentLimit });
  let prevQuery = query;
  /** @type {ReadonlyArray<import("./emoji-items.js").EmojiPickerItem>} */
  let prevVisible = [];
  let emittedRecent = recent;
  let emittedUsage = usage;

  // The browser tests what it draws once the items are here, on the client
  // only. Until then, and on a server, every emoji shows.
  $: if (
    mounted &&
    maxVersion === undefined &&
    emoji.length > 0 &&
    probed !== emoji
  ) {
    probed = emoji;
    support = detectEmojiSupport(emoji);
  }
  $: visible = filterSupported(
    emoji,
    maxVersion === undefined ? support : { version: maxVersion },
  );

  // Emoji that arrive after the picker opens (the data loads on the first
  // open, and detection hides some), or that change, put the cursor back on
  // the chosen one and scroll to it, as an open does. Not over a search.
  $: if (visible !== prevVisible) {
    prevVisible = visible;
    if (mounted && query === "") tick().then(() => gridRef?.reset());
  }

  // A choice changes the frequently used emoji at once, but their section
  // shows the change when the grid next opens or the search clears, so a
  // cell does not move out from under the pointer.
  $: if (query !== prevQuery) {
    prevQuery = query;
    if (query === "") refreshFrequent();
  }
  // The app set `recent` or `usage` itself, from storage for one: show them.
  $: if (recent !== emittedRecent || usage !== emittedUsage) refreshFrequent();
  $: refreshFrequent(recentLimit);

  /** @param {number} [_limit] */
  function refreshFrequent(_limit) {
    emittedRecent = recent;
    emittedUsage = usage;
    shownFrequent = frequentIds({ recent, usage, limit: recentLimit });
  }

  /**
   * @param {import("./emoji-items.js").EmojiPickerItem} item
   * @param {number} tone
   */
  function glyphOf(item, tone) {
    return applySkinTone(item.emoji, tone, item.tones);
  }

  /** @param {CustomEvent<{ id: string; item: import("./emoji-items.js").EmojiPickerItem; selected: boolean }>} event */
  function handleSelect(event) {
    const { id, item, selected } = event.detail;
    if (selected && recentLimit > 0) {
      ({ recent, usage } = recordEmojiUse({
        id,
        recent,
        usage,
        limit: recentLimit,
      }));
      emittedRecent = recent;
      emittedUsage = usage;
    }
    dispatch("select", {
      id,
      item,
      emoji: glyphOf(item, skinTone),
      selected,
    });
  }

  /** @param {number} tone */
  function chooseTone(tone) {
    skinTone = /** @type {0 | 1 | 2 | 3 | 4 | 5} */ (tone);
  }

  onMount(() => {
    mounted = true;
  });
</script>

<div class:bx--emoji-picker__body={true}>
  <PickerGrid
    bind:this={gridRef}
    items={visible}
    cellSize={36}
    {selectionMode}
    bind:selectedId={value}
    bind:selectedIds={values}
    bind:query
    recent={shownFrequent}
    {recentLimit}
    {...$$restProps}
    on:select={handleSelect}
    on:highlight
    on:window:change
  >
    <svelte:fragment slot="cell" let:item>
      <span class:bx--emoji-picker__glyph={true} aria-hidden="true"
        >{glyphOf(item, skinTone)}</span
      >
    </svelte:fragment>
    <svelte:fragment slot="preview" let:item>
      <span class:bx--emoji-picker__preview-glyph={true}
        >{glyphOf(item, skinTone)}</span
      >
      <span class:bx--emoji-picker__preview-name={true}>{item.label}</span>
      <code class:bx--emoji-picker__preview-code={true}>:{item.shortcode}:</code
      >
    </svelte:fragment>
  </PickerGrid>
  <div class:bx--emoji-picker__tones={true}>
    <span id={toneLabelId} class:bx--emoji-picker__tones-label={true}
      >{skinToneLabelText}</span
    >
    <div
      bind:this={tonesRef}
      role="radiogroup"
      aria-labelledby={toneLabelId}
      class:bx--emoji-picker__tone-group={true}
      use:rovingFocus={{
        selector: "button",
        orientation: "horizontal",
        getActiveIndex: () => skinTone,
        onMove: chooseTone,
        focusOnMove: true,
        rtl: () => resolveLayoutDirection($layoutDirection, tonesRef) === "rtl",
      }}
    >
      {#each TONES as tone (tone)}
        <button
          type="button"
          role="radio"
          aria-checked={tone === skinTone ? "true" : "false"}
          aria-label={skinToneNames[tone]}
          tabindex={tone === skinTone ? 0 : -1}
          class:bx--emoji-picker__tone={true}
          class:bx--emoji-picker__tone--selected={tone === skinTone}
          on:click={() => chooseTone(tone)}
        >
          <span aria-hidden="true">{applySkinTone(TONE_SAMPLE, tone, [0])}</span
          >
        </button>
      {/each}
    </div>
  </div>
</div>
