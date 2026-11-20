<script>
  /**
   * @typedef {import("../utils/json-path.js").PathSegment} PathSegment
   * @typedef {import("../utils/json-path.js").PathFormat} PathFormat
   */

  /**
   * @restProps {div}
   * @event {{ path: string; segments: PathSegment[]; type: string; value: unknown }} select - Dispatched when the row the path bar describes changes.
   * @event {{ path: string; expanded: boolean }} toggle - Dispatched when a row expands or collapses by hand.
   * @event {{ kind: "value" | "path"; text: string }} copy - Dispatched after a value or a path is copied.
   */

  /**
   * Specify the value to show: JSON, or any JavaScript value, including
   * `Date`, `Map`, `Set`, `undefined`, `BigInt` and circular references.
   * The viewer reads the value as it expands a row. To show a change made
   * inside the value, assign it again.
   * @type {any}
   */
  export let value = null;

  /**
   * Specify how many levels start expanded. `0` shows only the root row, `1`
   * shows its children, and `Infinity` expands everything.
   */
  export let expandDepth = 1;

  /**
   * Specify the row height: `"xs"` is 24px and `"sm"` is 32px.
   * @type {"xs" | "sm"}
   */
  export let size = "xs";

  /**
   * Specify the height of the tree. A number is in pixels, and a string is
   * any CSS length.
   * @type {number | string}
   */
  export let height = 400;

  /** Specify the label above the tree, which also names it. */
  export let labelText = "";

  /** Set to `true` to hide the label visually. It still names the tree. */
  export let hideLabel = false;

  /**
   * Specify the search text. Rows whose key or value contains it are
   * highlighted, and their ancestors expand.
   * @type {string}
   */
  export let query = "";

  /** Set to `false` to hide the toolbar and the path bar. */
  export let toolbar = true;

  /**
   * Specify a keyboard shortcut that focuses the search field, such as `"/"`.
   * @type {string}
   */
  export let searchShortcut = "";

  /**
   * Specify how paths are written: `"jsonpath"` as `$.a.b[3]`, or `"js"` as
   * `data.a.b[3]`.
   * @type {PathFormat}
   */
  export let pathFormat = "jsonpath";

  /** Specify the identifier a `"js"` path starts from. */
  export let rootName = "data";

  /** Specify the label of the root row. */
  export let rootLabel = "$";

  /**
   * Specify the most characters of a string a row shows. A longer string ends
   * in an ellipsis and expands into rows of this length.
   */
  export let maxStringLength = 100;

  /** Set to `true` to show each value's type after it. */
  export let showTypes = false;

  /** Specify the most matches a search collects. */
  export let maxMatches = 5000;

  /**
   * Specify the most nodes a search or an expand-all creates. It stops a
   * value that shares one object many times from growing without end.
   */
  export let nodeLimit = 2_000_000;

  /**
   * The path of the active row, in the `pathFormat`.
   * @type {string}
   * @bindable readonly
   */
  export let path = "";

  /** Specify the placeholder of the search field. */
  export let searchPlaceholder = "Search keys and values";

  /** Specify the label of the search field. */
  export let searchLabel = "Search JSON";

  /** Specify the label of the previous match button. */
  export let previousMatchLabel = "Previous match";

  /** Specify the label of the next match button. */
  export let nextMatchLabel = "Next match";

  /** Specify the label of the expand all button. */
  export let expandAllLabel = "Expand all";

  /** Specify the label of the collapse all button. */
  export let collapseAllLabel = "Collapse all";

  /** Specify the label of the copy value button. */
  export let copyValueLabel = "Copy value";

  /** Specify the label of the copy path button. */
  export let copyPathLabel = "Copy path";

  /** Specify the label before the path. */
  export let pathLabel = "Path";

  /** Specify the text shown while a search has no matches. */
  export let noMatchesText = "No matches";

  /** Specify the text shown while a search runs. */
  export let searchingText = "Searching…";

  /** Specify the text shown when `nodeLimit`, or the most rows the browser scrolls, was reached. */
  export let limitText = "Limit reached";

  /**
   * Specify the text that counts the matches.
   * @type {(current: number, total: number, truncated: boolean) => string}
   */
  export let matchCountText = (current, total, truncated) =>
    `${current} of ${formatCount(total)}${truncated ? "+" : ""}`;

  /** Specify the id of the tree element. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the tree element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import Search from "../Search/Search.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import CollapseAll from "../icons/CollapseAll.svelte";
  import ExpandAll from "../icons/ExpandAll.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { copyText } from "../utils/copy-text.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    formatCount,
    keyText,
    serializeValue,
  } from "../utils/json-format.js";
  import { findByKeys, formatPath, pathSegments } from "../utils/json-path.js";
  import {
    buildRows,
    clearSearch,
    createWalk,
    revealAncestors,
    toggleRows,
  } from "../utils/json-tree-walk.js";
  import {
    FLAG_AUTO,
    FLAG_EXPANDED,
    JsonTree,
    KIND_NAMES,
  } from "../utils/json-tree.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import {
    FALLBACK_MAX_SCROLL_HEIGHT,
    getMaxScrollHeight,
  } from "../utils/max-scroll-height.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import JsonViewerRow from "./JsonViewerRow.svelte";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const typeahead = createTypeaheadBuffer();

  $: labelId = `${id}-label`;

  /** Rows rendered beyond the viewport on each side. */
  const OVERSCAN = 8;
  /** How far typeahead looks from the active row. */
  const TYPEAHEAD_SCAN_LIMIT = 20_000;
  // On the server there is no later turn to finish a walk in.
  const BUDGET_MS =
    typeof window === "undefined" ? Number.POSITIVE_INFINITY : 12;

  /** @type {string | undefined} */
  let ariaLabel;
  /** @type {string | undefined} */
  let ariaLabelledBy;
  /** @type {string | undefined} */
  let ariaDescribedBy;
  /** @type {Record<string, any>} */
  let rest;
  // The tree element carries the role, so the naming attributes go there and
  // the rest go on the root.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));

  /** @type {JsonTree} */
  let tree = new JsonTree(null);
  /** The visible rows, as node ids, in order. */
  /** @type {number[]} */
  let rows = [0];
  /** Bumped whenever a flag a row shows changes. */
  let rev = 0;
  let activeId = 0;
  let scrollTop = 0;
  /** @type {null | HTMLDivElement} */
  let scroller = null;
  let measuredHeight = 0;

  /** @type {number[]} */
  let matches = [];
  let matchIndex = -1;
  let truncated = false;
  let limited = false;
  /** Whether the rows were cut to what the browser can scroll. */
  let capped = false;
  let maxScrollHeight = FALLBACK_MAX_SCROLL_HEIGHT;
  /** @type {number[]} */
  let autoExpanded = [];
  let appliedQuery = "";
  let expanding = false;
  let searching = false;
  /** @type {null | ReturnType<typeof createWalk>} */
  let searchWalk = null;
  let expandGen = 0;
  let searchGen = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let expandTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let searchTimer;

  // These assign state through the functions they call, which the compiler
  // cannot see. Declared first, every `$:` below reads what they set.
  $: init(value, maxStringLength, expandDepth);
  $: applyQuery(query);

  // `VirtualList` types its items as records. These are node ids.
  /** @type {any[]} */
  let virtualRows = [];
  $: virtualRows = rows;
  /** @param {string} name */
  const rowHeightOf = (name) => (name === "sm" ? 32 : 24);
  $: rowHeight = rowHeightOf(size);
  $: viewport = measuredHeight || (typeof height === "number" ? height : 400);
  $: heightStyle = typeof height === "number" ? `${height}px` : height;
  /**
   * `VirtualList` hands each item over as a record. These are node ids.
   * @param {unknown} item
   * @returns {number}
   */
  const asNode = (item) => /** @type {number} */ (item);

  /**
   * @param {unknown} nextValue
   * @param {number} nextMaxStringLength
   * @param {number} depth
   */
  function init(nextValue, nextMaxStringLength, depth) {
    expandGen++;
    searchGen++;
    clearTimeout(expandTimer);
    clearTimeout(searchTimer);
    tree = new JsonTree(nextValue, { maxStringLength: nextMaxStringLength });
    rows = [0];
    activeId = 0;
    matches = [];
    matchIndex = -1;
    autoExpanded = [];
    searchWalk = null;
    appliedQuery = "";
    searching = false;
    limited = false;
    truncated = false;
    rev++;
    const walk = createWalk(tree, {
      expand: true,
      maxDepth: depth,
      limit: nodeLimit,
    });
    runExpand(walk, () => {
      commitRows(buildRows(tree));
      rev++;
      applyQuery(query, true);
    });
  }

  /**
   * Run a walk in time slices, so a large tree never holds the main thread.
   * @param {ReturnType<typeof createWalk>} walk
   * @param {() => void} done
   */
  function runExpand(walk, done) {
    const gen = ++expandGen;
    clearTimeout(expandTimer);
    expanding = true;
    const run = () => {
      if (gen !== expandGen) return;
      if (walk.step(BUDGET_MS)) {
        expanding = false;
        limited = walk.limited;
        done();
        return;
      }
      expandTimer = setTimeout(run, 0);
    };
    run();
  }

  /**
   * @param {string} text
   * @param {boolean} [force]
   */
  function applyQuery(text, force = false) {
    if (!force && text === appliedQuery) return;
    appliedQuery = text;
    const gen = ++searchGen;
    clearTimeout(searchTimer);

    const hadReveal = autoExpanded.length > 0;
    if (searchWalk) clearSearch(tree, searchWalk.matches, autoExpanded);
    searchWalk = null;
    autoExpanded = [];
    matches = [];
    matchIndex = -1;
    truncated = false;
    searching = false;
    if (hadReveal) {
      commitRows(buildRows(tree));
      activeId = visibleAncestorOrSelf(activeId);
    }
    rev++;
    if (!text) return;

    const walk = createWalk(tree, {
      query: text,
      limit: nodeLimit,
      maxMatches,
    });
    searchWalk = walk;
    searching = true;
    const run = () => {
      if (gen !== searchGen) return;
      if (walk.step(BUDGET_MS)) {
        searching = false;
        matches = walk.matches;
        truncated = walk.truncated;
        limited = limited || walk.limited;
        autoExpanded = revealAncestors(tree, matches);
        commitRows(buildRows(tree));
        rev++;
        if (matches.length > 0) goToMatch(0);
        return;
      }
      searchTimer = setTimeout(run, 0);
    };
    run();
  }

  /**
   * Show these rows, cut to what the browser can scroll. A list taller than
   * that does not scroll in Firefox at all.
   * @param {number[]} next
   */
  function commitRows(next) {
    const limit = Math.max(1, Math.floor(maxScrollHeight / rowHeightOf(size)));
    capped = next.length > limit;
    if (capped) next.length = limit;
    rows = next;
  }

  /**
   * The row `node` shows as: itself when every ancestor is open, else the
   * nearest closed ancestor, which holds it.
   * @param {number} node
   * @returns {number}
   */
  function visibleAncestorOrSelf(node) {
    const chain = [...tree.ancestors(node).reverse(), node];
    for (let i = 0; i < chain.length - 1; i++) {
      if (!tree.isExpanded(chain[i])) return chain[i];
    }
    return node;
  }

  /** @param {number} node */
  function showNode(node) {
    let changed = false;
    for (const ancestor of tree.ancestors(node)) {
      if (!tree.isExpanded(ancestor)) {
        tree.setExpanded(ancestor, true, true);
        autoExpanded.push(ancestor);
        changed = true;
      }
    }
    if (changed) {
      commitRows(buildRows(tree));
      rev++;
    }
  }

  $: currentId = matchIndex >= 0 ? matches[matchIndex] : -1;
  $: matchStatus = searching
    ? searchingText
    : query === ""
      ? limited || capped
        ? limitText
        : ""
      : matches.length === 0
        ? noMatchesText
        : matchCountText(matchIndex + 1, matches.length, truncated);

  /** @param {number} index */
  function goToMatch(index) {
    matchIndex = index;
    const node = matches[index];
    showNode(node);
    setActive(node);
    scrollToIndex(rows.indexOf(node), true);
    alignRow(node);
  }

  /** Move to the next match, wrapping at the end. */
  export function findNext() {
    if (matches.length === 0) return;
    goToMatch((matchIndex + 1) % matches.length);
  }

  /** Move to the previous match, wrapping at the start. */
  export function findPrevious() {
    if (matches.length === 0) return;
    goToMatch((matchIndex - 1 + matches.length) % matches.length);
  }

  /** Expand every row, to the limit of `nodeLimit`. */
  export function expandAll() {
    const walk = createWalk(tree, { expand: true, limit: nodeLimit });
    runExpand(walk, () => {
      commitRows(buildRows(tree));
      rev++;
    });
  }

  /** Collapse every row below the root. */
  export function collapseAll() {
    expandGen++;
    expanding = false;
    const flags = tree.flags;
    for (let i = 0; i < tree.length; i++) {
      flags[i] &= ~(FLAG_EXPANDED | FLAG_AUTO);
    }
    tree.setExpanded(0, true);
    autoExpanded = [];
    commitRows(buildRows(tree));
    activeId = visibleAncestorOrSelf(activeId);
    rev++;
  }

  /**
   * Expand to a depth, collapsing what is deeper. Depth 0 is the root row.
   * @param {number} depth
   */
  export function expandToDepth(depth) {
    collapseAll();
    const walk = createWalk(tree, {
      expand: true,
      maxDepth: depth,
      limit: nodeLimit,
    });
    runExpand(walk, () => {
      commitRows(buildRows(tree));
      rev++;
    });
  }

  /**
   * Scroll to a row and make it the active one, expanding its ancestors.
   * @param {ReadonlyArray<string | number>} keys A property name or index per level.
   * @returns {boolean} Whether the path exists.
   */
  export function reveal(keys) {
    const node = findByKeys(tree, keys);
    if (node < 0) return false;
    showNode(node);
    setActive(node);
    scrollToIndex(rows.indexOf(node), true);
    alignRow(node);
    return true;
  }

  /** @param {number} node */
  function setActive(node) {
    if (node === activeId) return;
    activeId = node;
    const segments = pathSegments(tree, node);
    dispatch("select", {
      path: formatPath(segments, pathFormat, rootName),
      segments,
      type: KIND_NAMES[tree.kinds[node]],
      value: tree.values[node],
    });
  }

  $: path = formatPath(pathSegments(tree, activeId), pathFormat, rootName);

  /**
   * @param {number} index
   * @param {boolean} [center] Center a row that is out of view.
   */
  function scrollToIndex(index, center = false) {
    if (!scroller || index < 0) return;
    const top = index * rowHeight;
    const bottom = top + rowHeight;
    const current = scroller.scrollTop;
    let next = current;
    if (top < current) {
      next = center ? top - (viewport - rowHeight) / 2 : top;
    } else if (bottom > current + viewport) {
      next = center ? top - (viewport - rowHeight) / 2 : bottom - viewport;
    }
    next = Math.max(0, next);
    if (next === current) return;
    scroller.scrollTop = next;
    // The browser's own scroll event is a frame away, and `VirtualList` has
    // to move its window before the row can take focus.
    scroller.dispatchEvent(new Event("scroll"));
  }

  /**
   * Scroll sideways until the start of the row's content is in view. A deep
   * row's indent can be wider than the tree. Reads positions, so it works the
   * same in either writing direction.
   * @param {Element | null | undefined} row
   */
  function revealStart(row) {
    const start = row?.querySelector(".bx--json-viewer__toggle");
    if (!scroller || !start) return;
    const edge = start.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    const pad = 16;
    const want = Math.min(280, box.width - 2 * pad);
    if (edge.left < box.left + pad) {
      scroller.scrollLeft -= box.left + pad - edge.left;
    } else if (edge.left + want > box.right - pad) {
      scroller.scrollLeft += edge.left + want - (box.right - pad);
    }
  }

  /**
   * Bring a row's content into the sideways view once it renders.
   * @param {number} node
   */
  async function alignRow(node) {
    await tick();
    revealStart(scroller?.querySelector(`[data-json-id="${node}"]`));
  }

  /** @param {number} node */
  function focusRow(node) {
    const row = scroller?.querySelector(`[data-json-id="${node}"]`);
    if (row instanceof HTMLElement) row.focus({ preventScroll: true });
    revealStart(row);
  }

  /** @param {number} index */
  async function moveTo(index) {
    if (rows.length === 0) return;
    const clamped = Math.min(rows.length - 1, Math.max(0, index));
    const node = rows[clamped];
    setActive(node);
    scrollToIndex(clamped);
    await tick();
    focusRow(node);
  }

  /**
   * @param {number} index
   * @param {boolean} expanded
   */
  function toggleAt(index, expanded) {
    const node = rows[index];
    if (!tree.canExpand(node) || tree.isExpanded(node) === expanded) return;
    commitRows(toggleRows(tree, rows, index, expanded));
    rev++;
    dispatch("toggle", {
      path: formatPath(pathSegments(tree, node), pathFormat, rootName),
      expanded,
    });
  }

  /** @param {number} node */
  function toggleNode(node) {
    const index = rows.indexOf(node);
    if (index >= 0) toggleAt(index, !tree.isExpanded(node));
  }

  /** @param {number} node */
  function expandBelow(node) {
    const walk = createWalk(tree, {
      start: node,
      expand: true,
      limit: nodeLimit,
    });
    runExpand(walk, () => {
      commitRows(buildRows(tree));
      rev++;
    });
  }

  $: activeIndex = rows.indexOf(activeId);
  $: visibleFirst = Math.max(
    0,
    Math.min(rows.length - 1, Math.floor(scrollTop / rowHeight)),
  );
  $: windowStart = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - OVERSCAN + 1,
  );
  $: windowEnd = Math.ceil((scrollTop + viewport) / rowHeight) + OVERSCAN - 1;
  // One row owns the tab stop. When the active row has scrolled out of the
  // rendered window, the first row in view takes it, so Tab still lands.
  $: anchorId =
    activeIndex >= windowStart && activeIndex < windowEnd
      ? activeId
      : (rows[visibleFirst] ?? 0);

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const index = rows.indexOf(activeId);
    if (index < 0) return;
    const node = rows[index];
    const key = inlineKey(
      event.key,
      $layoutDirection,
      event.currentTarget instanceof Element ? event.currentTarget : null,
    );
    const page = Math.max(1, Math.floor(viewport / rowHeight) - 1);

    switch (key) {
      case "ArrowDown":
        moveTo(index + 1);
        break;
      case "ArrowUp":
        moveTo(index - 1);
        break;
      case "ArrowRight":
        if (!tree.canExpand(node)) return;
        if (tree.isExpanded(node)) moveTo(index + 1);
        else toggleAt(index, true);
        break;
      case "ArrowLeft": {
        if (tree.canExpand(node) && tree.isExpanded(node)) {
          toggleAt(index, false);
          break;
        }
        const depth = tree.depths[node];
        let parent = index - 1;
        while (parent >= 0 && tree.depths[rows[parent]] >= depth) parent--;
        if (parent < 0) return;
        moveTo(parent);
        break;
      }
      case "Home":
        moveTo(0);
        break;
      case "End":
        moveTo(rows.length - 1);
        break;
      case "PageDown":
        moveTo(index + page);
        break;
      case "PageUp":
        moveTo(index - page);
        break;
      case "Enter":
      case " ":
        if (tree.canExpand(node)) toggleAt(index, !tree.isExpanded(node));
        break;
      case "*":
        if (!tree.canExpand(node)) return;
        expandBelow(node);
        break;
      default: {
        if (!isTypeaheadKey(event)) return;
        const text = typeahead.push(event.key);
        const slice = rows.slice(index, index + TYPEAHEAD_SCAN_LIMIT);
        const found = typeaheadIndex({
          items: slice,
          query: text,
          itemToString: (candidate) => keyText(tree, candidate, rootLabel).text,
          index: 0,
          isDisabled: () => false,
        });
        if (found !== 0) moveTo(index + found);
        // A page shortcut, such as `/` for the search field, still sees the key.
        return;
      }
    }
    event.preventDefault();
  }

  /**
   * Copy the active row on a plain copy, unless text is selected.
   * @param {ClipboardEvent} event
   */
  function handleCopy(event) {
    const selection =
      typeof window === "undefined" ? null : window.getSelection();
    if (selection && !selection.isCollapsed) return;
    const text = serializeValue(tree, activeId);
    event.clipboardData?.setData("text/plain", text);
    event.preventDefault();
    dispatch("copy", { kind: "value", text });
  }

  /** @param {"value" | "path"} kind */
  async function copyActive(kind) {
    const text = kind === "value" ? serializeValue(tree, activeId) : path;
    await copyText(text);
    dispatch("copy", { kind, text });
  }

  /** Keep the tree's keyboard focus when the focused row scrolls away. */
  async function handleScroll() {
    if (!scroller) return;
    scrollTop = scroller.scrollTop;
    const hadFocus = scroller.contains(document.activeElement);
    if (!hadFocus) return;
    await tick();
    if (scroller && !scroller.contains(document.activeElement)) {
      focusRow(anchorId);
    }
  }

  /** @param {KeyboardEvent} event */
  function handleSearchKeydown(event) {
    if (event.key !== "Enter" || isImeComposition(event)) return;
    event.preventDefault();
    if (event.shiftKey) findPrevious();
    else findNext();
  }

  onMount(() => {
    maxScrollHeight = getMaxScrollHeight();
    if (capped) commitRows(buildRows(tree));
    /** @type {ResizeObserver | undefined} */
    let observer;
    if (scroller && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        if (scroller) measuredHeight = scroller.clientHeight;
      });
      observer.observe(scroller);
    }
    if (scroller) {
      measuredHeight = scroller.clientHeight;
      scrollTop = scroller.scrollTop;
    }

    return () => {
      expandGen++;
      searchGen++;
      clearTimeout(expandTimer);
      clearTimeout(searchTimer);
      typeahead.clear();
      observer?.disconnect();
    };
  });

  $: ref = scroller;
</script>

<div
  class:bx--json-viewer={true}
  class:bx--json-viewer--sm={size === "sm"}
  {...rest}
>
  {#if labelText && !hideLabel}
    <div class:bx--label={true} id={labelId}>{labelText}</div>
  {/if}
  <div class:bx--json-viewer__frame={true}>
    {#if toolbar}
      <div class:bx--json-viewer__toolbar={true}>
        <div class:bx--json-viewer__search={true}>
          <Search
            size="sm"
            bind:value={query}
            id="{id}-search"
            labelText={searchLabel}
            hideLabel
            placeholder={searchPlaceholder}
            shortcut={searchShortcut}
            on:keydown={handleSearchKeydown}
          />
        </div>
        <span
          class:bx--json-viewer__status={true}
          role="status"
          aria-live="polite"
          dir="auto"
          >{#if matchStatus}<bdi>{matchStatus}</bdi>{/if}</span
        >
        <Button
          kind="ghost"
          size="small"
          icon={ArrowUp}
          iconDescription={previousMatchLabel}
          disabled={matches.length === 0}
          on:click={findPrevious}
        />
        <Button
          kind="ghost"
          size="small"
          icon={ArrowDown}
          iconDescription={nextMatchLabel}
          disabled={matches.length === 0}
          on:click={findNext}
        />
        <span class:bx--json-viewer__divider={true} aria-hidden="true"></span>
        <Button
          kind="ghost"
          size="small"
          icon={ExpandAll}
          iconDescription={expandAllLabel}
          on:click={expandAll}
        />
        <Button
          kind="ghost"
          size="small"
          icon={CollapseAll}
          iconDescription={collapseAllLabel}
          on:click={collapseAll}
        />
        <CopyButton
          kind="ghost"
          size="sm"
          iconDescription={copyValueLabel}
          copy={() => copyActive("value")}
        />
      </div>
    {/if}
    <div
      bind:this={scroller}
      {id}
      role="tree"
      tabindex="-1"
      class:bx--json-viewer__tree={true}
      style:height={heightStyle}
      style:--ccs-json-row-height="{rowHeight}px"
      aria-label={ariaLabel ??
        (labelText && hideLabel ? labelText : undefined) ??
        (labelText ? undefined : "JSON")}
      aria-labelledby={ariaLabelledBy ??
        (labelText && !hideLabel && !ariaLabel ? labelId : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={expanding || searching ? "true" : undefined}
      on:keydown
      on:keydown={handleKeydown}
      on:scroll={handleScroll}
      on:copy={handleCopy}
    >
      <VirtualList
        items={virtualRows}
        itemHeight={rowHeight}
        containerHeight={viewport}
        overscan={OVERSCAN}
        scrollElement={scroller}
        spacerTag="div"
        getKey={asNode}
        let:item
      >
        {@const node = asNode(item)}
        <JsonViewerRow
          {tree}
          id={node}
          {rev}
          treeId={id}
          {query}
          {showTypes}
          {rootLabel}
          active={node === activeId}
          current={node === currentId}
          tabbable={node === anchorId}
          on:activate={() => setActive(node)}
          on:toggle={() => toggleNode(node)}
        />
      </VirtualList>
    </div>
    {#if toolbar}
      <div class:bx--json-viewer__path={true}>
        <span class:bx--json-viewer__path-label={true}>{pathLabel}</span>
        <code class:bx--json-viewer__path-text={true} dir="ltr">{path}</code>
        <CopyButton
          kind="ghost"
          size="sm"
          iconDescription={copyPathLabel}
          copy={() => copyActive("path")}
        />
      </div>
    {/if}
  </div>
</div>
