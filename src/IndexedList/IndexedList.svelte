<script>
  /**
   * @template {Record<string, unknown>} [Item=Record<string, unknown>]
   */

  /**
   * @restProps {div}
   * @slot {{ item: Item; index: number; section: string; }}
   * @slot {{ section: string; count: number; }} header
   * @slot {Record<string, never>} empty
   */

  /**
   * Specify the items to list. They are sorted and filed under index
   * letters, so their order does not matter.
   * A browser scrolls only so far, about 17.9 million pixels in Firefox, so
   * the list holds about 300,000 items at the default height.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Specify the text an item sorts and files by, such as a name. Pass a
   * reading (furigana, pinyin) for names written in characters that carry
   * no letter of their own.
   * Defaults to the item's `text`.
   * @type {(item: Item) => string}
   */
  export let itemToString = defaultItemToString;

  /**
   * Specify the BCP 47 locale. It picks the alphabet of the index (Å, Ä and
   * Ö after Z in `"sv"`, kana rows in `"ja"`, pinyin initials in `"zh"`,
   * Arabic and Hebrew letters) and the sort order. It is not read from the
   * page, so server and browser agree.
   */
  export let locale = "en";

  /**
   * Specify which index letter an item files under, instead of the first
   * letter of its text. Use it for a script the alphabet tables do not
   * cover. Return one of `sections`, or `"#"`.
   * @type {undefined | ((item: Item, locale: string) => string)}
   */
  export let groupBy = undefined;

  /**
   * Specify the index letters in order, instead of the locale's alphabet.
   * With `groupBy` alone, the letters it returns are used, in the locale's
   * sort order.
   * @type {undefined | ReadonlyArray<string>}
   */
  export let sections = undefined;

  /** Set to `false` to keep items in the order given within each section. */
  export let sort = true;

  /**
   * Specify the height of the list. A number is pixels; a string is a CSS
   * length. The list scrolls inside it and the index rail fits it.
   * @type {number | string}
   */
  export let height = 480;

  /**
   * Specify the height of each item in pixels. Items are all this tall;
   * their content is clipped to it.
   */
  export let itemHeight = 56;

  /** Specify the height of each section header in pixels. */
  export let headerHeight = 32;

  /** Specify the number of items to render above and below the viewport. */
  export let overscan = 6;

  /** Specify the heading level of the section headers. */
  export let headingLevel = 3;

  /** Set to `true` to hide the index rail. Headers still stick. */
  export let hideIndex = false;

  /**
   * Specify the height in pixels of one letter on the index rail. The rail
   * is as tall as its letters, until the list is too short for all of them.
   * It then shows every other letter, or fewer, with a dot for each one it
   * leaves out. 24 is the smallest touch target WCAG allows.
   */
  export let indexSize = 24;

  /** Specify the ARIA label for the list. */
  export let labelText = "List";

  /** Specify the ARIA label for the index rail. */
  export let indexLabelText = "Index";

  /**
   * Specify the accessible name of an index letter.
   * @type {(section: { key: string; count: number }) => string}
   */
  export let jumpLabel = defaultJumpLabel;

  /**
   * Specify what the live region says after a jump.
   * @type {(section: { key: string; count: number }) => string}
   */
  export let announcement = defaultAnnouncement;

  /**
   * The index letter of the section at the top of the list.
   * @type {string | undefined}
   * @bindable readonly
   */
  export let currentSection = undefined;

  /**
   * Obtain a reference to the scrolling element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Scroll to the first item of a section, as a tap on its letter does.
   * Does nothing for a letter with no items.
   * Set `focus` to move focus to the section header, as Enter on the rail does.
   * @type {(key: string, options?: { focus?: boolean }) => void}
   */
  export function scrollToSection(key, options = {}) {
    const section = groups.findIndex((group) => group.key === key);
    if (section >= 0) jumpTo(section, options.focus === true);
  }

  import { onMount, tick } from "svelte";
  import { debounce } from "../utils/debounce.js";
  import { groupIndexItems } from "../utils/index-groups.js";
  import {
    buildIndexedLayout,
    getIndexedWindow,
  } from "../utils/indexed-list-layout.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";

  /** The dot a letter shrinks to when the rail is too short for it. */
  const DOT = "•";
  /** Space above and below the letters, in pixels. */
  const RAIL_PADDING = 8;
  /** Quiet time before the live region speaks a scrubbed-to section. */
  const ANNOUNCE_DELAY = 400;

  /** @param {Item} item */
  function defaultItemToString(item) {
    return String(item?.text ?? "");
  }

  /** @param {{ key: string; count: number }} section */
  function defaultJumpLabel({ key, count }) {
    return `Jump to ${key}, ${count} ${count === 1 ? "item" : "items"}`;
  }

  /** @param {{ key: string; count: number }} section */
  function defaultAnnouncement({ key, count }) {
    return `Section ${key}, ${count} ${count === 1 ? "item" : "items"}`;
  }

  let scrollTop = 0;
  /** How far the last scroll moved, and which way. */
  let lead = 0;
  let viewportHeight = typeof height === "number" ? height : 480;
  let railHeight = viewportHeight;
  /** The section a jump landed on, until the reader scrolls away from it. */
  let pinned = -1;
  /** Where the scroller rested after the jump, to tell the reader's scroll. */
  let pinnedTop = 0;
  /** The section the pointer is scrubbing, or -1. */
  let scrubbing = -1;
  let scrubY = 0;
  let scrubStarted = false;
  /** The letter holding focus, or -1. */
  let focused = -1;
  let lastFocused = -1;
  let status = "";
  let statusFlip = false;
  /** A press on the rail is a click too; the press already handled it. */
  let pressHandled = false;
  /** @type {null | HTMLDivElement} */
  let root = null;
  /** @type {null | HTMLUListElement} */
  let indexList = null;
  /** @type {import("../utils/indexed-list-layout.js").IndexedWindow | undefined} */
  let view;

  $: groups = groupIndexItems(items, {
    sortKey: itemToString,
    locale,
    groupBy,
    sections,
    sort,
  });
  $: counts = groups.map((group) => group.items.length);
  $: layout = buildIndexedLayout(counts, itemHeight, headerHeight);
  $: windowed = getIndexedWindow(
    layout,
    scrollTop,
    viewportHeight,
    overscan * itemHeight,
    lead,
  );
  $: updateView(windowed);

  /**
   * Hand the template a new window only when its rows change, so a scroll
   * that moves no row costs no update.
   * @param {import("../utils/indexed-list-layout.js").IndexedWindow} next
   */
  function updateView(next) {
    const prev = view;
    if (
      prev &&
      prev.before === next.before &&
      prev.after === next.after &&
      prev.section === next.section &&
      prev.rows.length === next.rows.length &&
      prev.rows[0]?.key === next.rows[0]?.key &&
      prev.rows[prev.rows.length - 1]?.key ===
        next.rows[next.rows.length - 1]?.key
    ) {
      return;
    }
    view = next;
  }

  // Where each section's rows start in the list as a whole, for
  // `aria-posinset`. A header is a list item too.
  $: positions = (() => {
    /** @type {number[]} */
    const bases = [];
    let size = 0;
    for (const count of counts) {
      bases.push(size);
      if (count > 0) size += count + 1;
    }
    return { bases, size };
  })();

  $: current = pinned >= 0 ? pinned : (view?.section ?? -1);
  $: currentSection = groups[current]?.key;

  // The rail. A letter owns an equal share of its height; when the shares
  // are shorter than `indexSize`, only every `step`th letter is drawn.
  $: zone = Math.min(
    indexSize,
    Math.max(railHeight - RAIL_PADDING * 2, 0) / Math.max(groups.length, 1),
  );
  $: step = zone >= indexSize || zone <= 0 ? 1 : Math.ceil(indexSize / zone);
  $: enabledSections = counts.flatMap((count, section) =>
    count > 0 ? [section] : [],
  );
  $: tabStop =
    counts[lastFocused] > 0
      ? lastFocused
      : counts[current] > 0
        ? current
        : (enabledSections[0] ?? -1);

  /** @param {number} section */
  function isShown(section) {
    if (step === 1 || section % step === 0) return true;
    // The last letter shows when it is not crowding the one before it.
    return section === groups.length - 1 && (section % step) * 2 >= step;
  }

  /** @param {number} section */
  function labelOf(section) {
    return isShown(section) || focused === section || scrubbing === section
      ? groups[section].key
      : DOT;
  }

  const speak = debounce((/** @type {string} */ text) => {
    statusFlip = !statusFlip;
    status = statusFlip ? text : `${text} `;
  }, ANNOUNCE_DELAY);

  /**
   * @param {number} section
   * @param {boolean} [focusHeader]
   */
  function jumpTo(section, focusHeader = false) {
    if (!ref || !(counts[section] > 0)) return;
    // One write and one read: the content height is already set, so the
    // read costs a single layout, and the window moves in this frame.
    ref.scrollTop = layout.offsets[section];
    pinnedTop = ref.scrollTop;
    // A jump is no scroll to run ahead of.
    lead = 0;
    scrollTop = pinnedTop;
    pinned = section;
    speak(announcement({ key: groups[section].key, count: counts[section] }));
    if (focusHeader) {
      tick().then(() => {
        /** @type {HTMLElement | null | undefined} */
        const header = ref?.querySelector(`[data-section="${section}"]`);
        header?.focus({ preventScroll: true });
      });
    }
  }

  /** @param {Event} [_event] */
  function handleScroll(_event) {
    if (!ref) return;
    lead = ref.scrollTop - scrollTop;
    scrollTop = ref.scrollTop;
    if (pinned >= 0 && Math.abs(scrollTop - pinnedTop) > 1) pinned = -1;
  }

  /**
   * The next letter with items from `section` in `direction`.
   * @param {number} section
   * @param {1 | -1} direction
   */
  function nextEnabled(section, direction) {
    for (let s = section; s >= 0 && s < counts.length; s += direction) {
      if (counts[s] > 0) return s;
    }
    return -1;
  }

  /**
   * The letter under the pointer, or after it when it has no items.
   * @param {PointerEvent} event
   */
  function sectionAtPointer(event) {
    if (!indexList) return -1;
    const rect = indexList.getBoundingClientRect();
    const share = rect.height / groups.length;
    const zoneIndex = Math.min(
      Math.max(Math.floor((event.clientY - rect.top) / share), 0),
      groups.length - 1,
    );
    return zoneIndex;
  }

  /** @param {PointerEvent} event */
  function scrub(event) {
    const hovered = sectionAtPointer(event);
    if (hovered < 0) return;
    const rect = root?.getBoundingClientRect();
    scrubY = Math.min(
      Math.max(event.clientY - (rect?.top ?? 0), 0),
      rect?.height ?? 0,
    );
    // A letter with no items hands over to the next with some, or the last.
    let target = nextEnabled(hovered, 1);
    if (target < 0) target = nextEnabled(hovered, -1);
    if (target < 0) return;
    // A press on a dimmed letter does nothing; a drag across one moves on.
    if (!scrubStarted && counts[hovered] === 0) return;
    scrubStarted = true;
    if (target !== scrubbing) {
      scrubbing = target;
      jumpTo(target);
    }
  }

  /** @param {PointerEvent} event */
  function handlePress(event) {
    pressHandled = true;
    scrubStarted = false;
    scrub(event);
  }

  function handleRelease() {
    scrubbing = -1;
    scrubStarted = false;
    // The click that follows a press arrives before this timer fires.
    setTimeout(() => {
      pressHandled = false;
    }, 0);
  }

  /** @param {number} section */
  function handleClick(section) {
    if (pressHandled || !(counts[section] > 0)) return;
    // A click with no pointer behind it is the keyboard or a screen reader.
    jumpTo(section, true);
  }

  /** @param {number} section */
  function focusLetter(section) {
    /** @type {HTMLElement | null | undefined} */
    const button = indexList?.querySelector(`[data-index="${section}"]`);
    button?.focus();
  }

  /** @param {KeyboardEvent} event */
  function handleIndexKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = /** @type {HTMLElement} */ (event.target);
    const from = Number(
      target.closest("[data-index]")?.getAttribute("data-index"),
    );
    if (Number.isNaN(from)) return;

    let next = -1;
    if (event.key === "ArrowDown") next = nextEnabled(from + 1, 1);
    else if (event.key === "ArrowUp") next = nextEnabled(from - 1, -1);
    else if (event.key === "Home") next = nextEnabled(0, 1);
    else if (event.key === "End") next = nextEnabled(counts.length - 1, -1);
    else if (event.key.length === 1 && event.key.trim()) {
      // Typing a letter goes to it.
      const typed = event.key.toLocaleUpperCase(locale);
      next = groups.findIndex(
        (group, section) =>
          counts[section] > 0 &&
          (group.key === event.key ||
            group.key.toLocaleUpperCase(locale) === typed),
      );
      if (next >= 0) jumpTo(next);
    } else return;

    event.preventDefault();
    if (next >= 0) focusLetter(next);
  }

  /** @param {number} section */
  function handleFocus(section) {
    focused = section;
    lastFocused = section;
  }

  /** @param {{ contentRect: DOMRectReadOnly }} entry */
  function handleResize(entry) {
    railHeight = entry.contentRect.height;
    viewportHeight = ref?.clientHeight || railHeight;
  }

  onMount(() => {
    if (ref) scrollTop = ref.scrollTop;
    if (!root) return;
    const stop = observeResize(root, handleResize);
    return () => {
      stop();
      speak.cancel();
    };
  });

  $: heightStyle = typeof height === "number" ? `${height}px` : height;
</script>

<div
  bind:this={root}
  class:bx--indexed-list={true}
  class:bx--indexed-list--no-index={hideIndex || items.length === 0}
  style:height={heightStyle}
  style:--ccs-indexed-list-item-size="{itemHeight}px"
  style:--ccs-indexed-list-header-size="{headerHeight}px"
  style:--ccs-indexed-list-index-size="{indexSize}px"
  style:--ccs-indexed-list-count={groups.length}
>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={ref}
    role="region"
    aria-label={labelText}
    tabindex="0"
    {...$$restProps}
    class:bx--indexed-list__scroller={true}
    on:scroll={handleScroll}
  >
    {#if items.length === 0}
      <slot name="empty" />
    {:else if view}
      <div
        role="list"
        class:bx--indexed-list__list={true}
        style:padding-block-start="{view.before}px"
        style:padding-block-end="{view.after}px"
      >
        {#each view.rows as row (row.key)}
          <!-- Svelte 3 copies a slot's props into every slot's context getter,
          so a slot prop is a plain variable, not an expression on `row`. -->
          {@const group = groups[row.section]}
          {@const key = group.key}
          {@const count = counts[row.section]}
          {@const position = positions.bases[row.section]}
          {@const index = row.type === "item" ? row.index : -1}
          {@const item = group.items[index]}
          {#if row.type === "header"}
            <div
              role="listitem"
              class:bx--indexed-list__header={true}
              aria-posinset={position + 1}
              aria-setsize={positions.size}
            >
              <div
                role="heading"
                aria-level={headingLevel}
                tabindex="-1"
                class:bx--indexed-list__title={true}
                data-section={row.section}
              >
                <slot name="header" section={key} {count}>
                  {key}
                </slot>
              </div>
            </div>
          {:else}
            <div
              role="listitem"
              class:bx--indexed-list__item={true}
              aria-posinset={position + index + 2}
              aria-setsize={positions.size}
            >
              <slot {item} {index} section={key} />
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  {#if !hideIndex && items.length > 0}
    <nav class:bx--indexed-list__index={true} aria-label={indexLabelText}>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <ul
        bind:this={indexList}
        class:bx--indexed-list__index-list={true}
        use:pointerDrag={{
          onStart: handlePress,
          onMove: scrub,
          onEnd: handleRelease,
        }}
        on:keydown={handleIndexKeydown}
      >
        {#each groups as group, section (group.key)}
          <li class:bx--indexed-list__index-item={true}>
            <button
              type="button"
              class:bx--indexed-list__index-button={true}
              class:bx--indexed-list__index-button--current={current ===
                section}
              class:bx--indexed-list__index-button--collapsed={!isShown(
                section,
              )}
              aria-label={jumpLabel({ key: group.key, count: counts[section] })}
              aria-disabled={counts[section] > 0 ? undefined : "true"}
              aria-current={current === section ? "true" : undefined}
              tabindex={tabStop === section ? 0 : -1}
              data-index={section}
              on:click={() => handleClick(section)}
              on:focus={() => handleFocus(section)}
              on:blur={() => (focused = -1)}
            >
              <span
                class:bx--indexed-list__index-label={true}
                aria-hidden="true">{labelOf(section)}</span
              >
            </button>
          </li>
        {/each}
      </ul>
    </nav>
    {#if scrubbing >= 0}
      <div
        class:bx--indexed-list__bubble={true}
        aria-hidden="true"
        style:inset-block-start="{scrubY}px"
      >
        {groups[scrubbing].key}
      </div>
    {/if}
    <span role="status" aria-live="polite" class:bx--visually-hidden={true}
      >{status}</span
    >
  {/if}
</div>
