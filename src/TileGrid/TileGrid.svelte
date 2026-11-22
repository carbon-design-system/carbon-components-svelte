<script>
  /**
   * @template [Item=any]
   * @event {{ id: any; item: Item }} click:tile - User clicks a tile, or presses Enter or Space on it.
   * @slot {{ item: Item; index: number }} - The tile's media, such as an icon or an image.
   * @slot {{ item: Item; index: number }} itemLabel - Replace a tile's label text, for example to mark where a long name may break with `<wbr>`. Keep it to text: it names the tile.
   * @slot {{ group: any; items: ReadonlyArray<Item> }} group - Replace the text of a group's heading. Defaults to the group from `itemToGroup`.
   * @slot {{}} empty - Rendered in place of the grid when `items` is empty.
   * @restProps {div}
   */

  /**
   * Set the items to show, one tile each.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Return an item's unique id. Keys the tiles and keeps the tab stop on
   * the same item when `items` is sorted or filtered.
   * @type {(item: Item) => any}
   */
  export let itemToId = function itemToId(item) {
    return /** @type {any} */ (item).id;
  };

  /**
   * Return an item's label. It names the tile and is clamped to
   * `labelLines` lines; the full text shows in a `title` when it's cut off.
   * @type {(item: Item) => string}
   */
  export let itemToString = function itemToString(item) {
    const { text, id } = /** @type {any} */ (item);
    return String(text ?? id);
  };

  /**
   * Return an item's group to show the tiles in titled groups, in the
   * order each group first appears in `items`. The grid stays one tab
   * stop, and the arrow keys cross from one group to the next.
   * @type {undefined | ((item: Item) => any)}
   */
  export let itemToGroup = undefined;

  /**
   * Specify the label of the grid. Screen readers announce it with the
   * number of tiles. Set `aria-label` instead to name it with no label
   * element.
   */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Specify the narrowest a tile may be, as a CSS length. Columns fill the
   * container's width, each at least this wide.
   */
  export let minTileWidth = "8rem";

  /**
   * Specify the aspect ratio of each tile, as in `AspectRatio`: a named
   * ratio or any positive `"WxH"` string. The media fills the space above
   * the label. A string that is neither falls back to `"1x1"`.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}`}
   */
  export let ratio = "1x1";

  /**
   * Specify how many lines a label takes before it's cut off. Every tile
   * reserves them, so the media lines up across tiles.
   */
  export let labelLines = 2;

  /**
   * Align the media and the label: `"start"` puts the media at the top
   * start corner and the label under it at the start, `"center"` centers
   * both, as in an icon gallery.
   * @type {"start" | "center"}
   */
  export let align = "start";

  /**
   * Set the size: `"sm"` for dense galleries, such as icons, with less
   * padding and a smaller, secondary label.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Set how the media fills its area: `"contain"` keeps it at its own
   * size inside the tile's padding, `"cover"` stretches it to the tile's
   * edges and crops it, as for photos and previews.
   * @type {"contain" | "cover"}
   */
  export let mediaFit = "contain";

  /**
   * Specify the heading level of each group's title, to fit the page
   * outline. Inside a `Section`, defaults to one level below the section's
   * heading; otherwise to 3.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let groupHeadingLevel = undefined;

  /** Set an id for the grid. The label's and groups' ids derive from it. */
  export let id = useId("tile-grid");

  /**
   * Obtain a reference to the grid element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, tick } from "svelte";
  import { parseAspectRatio } from "../utils/aspect-ratio.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { useId } from "../utils/id-scope.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  // Undefined outside a `Section`; `$sectionLevel` is read only when it is set.
  /** @type {import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  const TILE_SELECTOR = ".bx--tile-grid__tile";

  const NAMED_RATIOS = [
    "2x1",
    "2x3",
    "16x9",
    "4x3",
    "1x1",
    "3x4",
    "3x2",
    "9x16",
    "1x2",
  ];

  /**
   * Split `items` into groups in the order each first appears. Without
   * `toGroup`, one untitled group holds every item.
   * @param {ReadonlyArray<Item>} items
   * @param {undefined | ((item: Item) => any)} toGroup
   * @returns {Array<{ key: any; items: Item[]; start: number }>}
   */
  function groupItems(items, toGroup) {
    if (!toGroup) return [{ key: undefined, items: [...items], start: 0 }];
    /** @type {Map<any, Item[]>} */
    const byKey = new Map();
    for (const item of items) {
      const key = toGroup(item);
      const group = byKey.get(key);
      if (group) group.push(item);
      else byKey.set(key, [item]);
    }
    let start = 0;
    return Array.from(byKey, ([key, members]) => {
      const group = { key, items: members, start };
      start += members.length;
      return group;
    });
  }

  /**
   * The item that holds the grid's one tab stop. Tracked by id, so it
   * stays on the same item when `items` is reordered.
   * @type {any}
   */
  let activeId;

  $: customRatio = NAMED_RATIOS.includes(ratio)
    ? null
    : parseAspectRatio(ratio);
  $: ratioClass = NAMED_RATIOS.includes(ratio)
    ? `bx--aspect-ratio--${ratio}`
    : customRatio
      ? "bx--aspect-ratio--custom"
      : "bx--aspect-ratio--1x1";
  $: customRatioPercentage = customRatio
    ? `${((customRatio.height / customRatio.width) * 100).toFixed(3)}%`
    : undefined;

  $: grouped = Boolean(itemToGroup);
  $: groups = groupItems(items, itemToGroup);
  // Ids in the order the tiles render, which `rovingFocus` indexes.
  $: ids = groups.flatMap((group) => group.items.map((item) => itemToId(item)));
  $: keepTabStop(ids);
  // Falls back to the first tile until one takes focus.
  $: activeIndex = Math.max(0, ids.indexOf(activeId));
  $: labelId = `${id}-label`;
  // An unnamed group says nothing, so the grid is a group only with a name.
  $: named = Boolean(
    labelText || $$restProps["aria-label"] || $$restProps["aria-labelledby"],
  );
  $: headingTag = `h${
    groupHeadingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 3)
  }`;

  /** @type {any[]} */
  let prevIds = [];

  /**
   * When the active item leaves `items`, move the tab stop to the item now
   * at its place (the next one), or the last one. If the tile had focus,
   * move focus with it, so it doesn't drop to the page.
   * @param {any[]} next
   */
  function keepTabStop(next) {
    const prev = prevIds;
    prevIds = next;
    if (activeId === undefined || next.includes(activeId)) return;
    const removedAt = prev.indexOf(activeId);
    const hadFocus =
      typeof document !== "undefined" &&
      Boolean(ref?.contains(document.activeElement));
    activeId =
      next.length > 0
        ? next[Math.min(Math.max(removedAt, 0), next.length - 1)]
        : undefined;
    if (!hadFocus || activeId === undefined) return;
    const index = next.indexOf(activeId);
    tick().then(() => getTiles()[index]?.focus());
  }

  /** @returns {HTMLElement[]} */
  function getTiles() {
    return ref ? Array.from(ref.querySelectorAll(TILE_SELECTOR)) : [];
  }
</script>

{#if labelText}
  <span
    id={labelId}
    class:bx--label={true}
    class:bx--visually-hidden={hideLabel}>{labelText}</span
  >
{/if}
{#if items.length === 0 && $$slots.empty}
  <slot name="empty" />
{:else}
  <!-- A group, when named, around one list or one list per group. -->
  <div
    bind:this={ref}
    {id}
    role={named ? "group" : undefined}
    aria-labelledby={labelText && !$$restProps["aria-label"]
      ? labelId
      : undefined}
    class:bx--tile-grid={true}
    class:bx--tile-grid--sm={size === "sm"}
    class:bx--tile-grid--center={align === "center"}
    class:bx--tile-grid--cover={mediaFit === "cover"}
    style:--ccs-tile-grid-min-width={minTileWidth}
    style:--ccs-tile-grid-label-lines={labelLines}
    {...$$restProps}
    use:rovingFocus={{
      selector: TILE_SELECTOR,
      orientation: "grid",
      wrap: false,
      itemsOnly: true,
      rtl: () => resolveLayoutDirection($layoutDirection, ref) === "rtl",
      getActiveIndex: () => activeIndex,
      onMove: (index, event) => {
        // Leave Alt/Ctrl/Meta+Arrow (Back, scroll) to the browser.
        if (hasModifierKey(event)) return;
        // Keep the page from scrolling with the arrow key.
        event.preventDefault();
        activeId = ids[index];
        getTiles()[index]?.focus();
      },
    }}
  >
    {#each groups as group, groupIndex (group.key)}
      {#if grouped}
        <svelte:element
          this={headingTag}
          id="{id}-group-{groupIndex}"
          class="bx--tile-grid__group-title"
        >
          <slot name="group" group={group.key} items={group.items}
            >{group.key}</slot
          >
        </svelte:element>
      {/if}
      <ul
        class:bx--tile-grid__list={true}
        aria-labelledby={grouped ? `${id}-group-${groupIndex}` : undefined}
      >
        {#each group.items as item, i (itemToId(item))}
          <!-- A plain const, not an expression in the slot props: Svelte 3
               copies slot prop expressions into the other slots' context,
               where `group` is undefined. -->
          {@const index = group.start + i}
          <li
            class="bx--aspect-ratio {ratioClass} bx--tile-grid__item"
            style:--ccs-aspect-ratio={customRatioPercentage}
          >
            <button
              type="button"
              class="bx--aspect-ratio--object bx--tile bx--tile--clickable bx--tile-grid__tile"
              tabindex={index === activeIndex ? 0 : -1}
              use:titleWhenTruncated={{
                measure: ".bx--tile-grid__label-text",
                multiline: true,
              }}
              on:focus={() => {
                activeId = ids[index];
              }}
              on:click={() => {
                dispatch("click:tile", { id: ids[index], item });
              }}
            >
              <span class:bx--tile-grid__media={true}>
                <slot {item} {index} />
              </span>
              <!-- The label reserves its lines; the text sits at the bottom,
                   so a one-line name lines up with the last line of others. -->
              <span class:bx--tile-grid__label={true}>
                <span
                  class="bx--tile-grid__label-text bx--text-truncate--multiline"
                  ><slot name="itemLabel" {item} {index}
                    >{itemToString(item)}</slot
                  ></span
                >
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/each}
  </div>
{/if}
