<script>
  /**
   * @typedef {import("../utils/log-lines.js").LogLevel} LogViewerLevel
   * @typedef {import("../utils/log-lines.js").LogLine} LogViewerLine
   * @typedef {{ start: number; end: number }} LogViewerSelection
   */

  /**
   * @restProps {div}
   * @event {{ lineCount: number }} copy
   * @event {{ error: unknown }} copy:error
   */

  /**
   * Specify the lines to show, oldest first. A string is one line, or
   * several if it holds newlines. An object states the line's `level` and
   * `time`; a string is read for a leading ISO timestamp and level word.
   *
   * Lines are meant to be appended: when the array grows and keeps its first
   * and last old lines, only the new lines are read. Any other change reads
   * the whole array again. For a stream, call `append` instead, which costs
   * the same however many lines the viewer holds.
   * @type {ReadonlyArray<LogViewerLine>}
   */
  export let lines = [];

  /**
   * Specify the most lines to keep. When more arrive, the oldest are dropped.
   * While the reader is scrolled up in `wrap` mode, the viewer keeps up to
   * twice this, so the lines being read do not move.
   */
  export let maxLines = 10000;

  /**
   * Specify the accessible name of the log, such as "Build output".
   * @type {string}
   */
  export let labelText = "";

  /**
   * Specify the height of the viewer as a CSS length. Use `"100%"` to fill a
   * parent that has a height.
   */
  export let height = "24rem";

  /**
   * Set to `true` to keep the newest line in view as lines arrive. Scrolling
   * up sets it to `false`, and scrolling back to the end, or "Jump to latest",
   * sets it back.
   * @bindable writable
   */
  export let follow = true;

  /**
   * Set to `true` to wrap long lines. Otherwise a line stays on one row and
   * the log scrolls sideways.
   * @bindable writable
   */
  export let wrap = false;

  /** Set to `false` to hide the line numbers. */
  export let lineNumbers = true;

  /** Set to `true` to show the time of lines that have one. */
  export let timestamps = false;

  /** Set to `false` to leave URLs as text instead of links. */
  export let links = true;

  /**
   * Specify the text to search for.
   * @bindable writable
   */
  export let query = "";

  /**
   * Set to `true` to read `query` as a regular expression.
   * @bindable writable
   */
  export let regex = false;

  /**
   * Set to `true` to match case.
   * @bindable writable
   */
  export let caseSensitive = false;

  /**
   * Specify the levels to show. A line with no level counts as `"info"`.
   * @type {ReadonlyArray<LogViewerLevel>}
   * @bindable writable
   */
  export let levels = ["debug", "info", "warn", "error"];

  /**
   * The selected lines, as a range of line ids, which are line numbers minus
   * one. Click a line number to select the line, and Shift+click another to
   * select the range between. Ctrl+A or Cmd+A selects every line shown.
   * Copying copies the selection.
   * @type {LogViewerSelection | null}
   * @bindable writable
   */
  export let selection = null;

  /** Set to `true` to hide the search and filter toolbar. */
  export let hideToolbar = false;

  /**
   * Set what screen readers are told as lines arrive. The log itself is not a
   * live region, since a virtualized window changes as it scrolls: this is a
   * separate region, updated at most once per `announceInterval`.
   * `"summary"` says how many lines arrived and how many were errors.
   * `"lines"` reads the newest lines. `"off"` says nothing, which suits a
   * fast stream.
   * @type {"summary" | "lines" | "off"}
   */
  export let announce = "summary";

  /** Specify the time in milliseconds between announcements. */
  export let announceInterval = 2000;

  /**
   * Specify the lowest contrast ratio that 256-color and truecolor text may
   * have against the page. Lighter or darker shades are drawn in its place,
   * so a color chosen for a dark terminal stays readable on White. `0`
   * draws colors as written.
   */
  export let minContrast = 4.5;

  /** Set an id for the viewer. The ids inside it are derived from it. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the scrolling log element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /** Specify the label of the toolbar. */
  export let toolbarLabelText = "Log controls";

  /** Specify the label of the search field. */
  export let searchLabelText = "Search the log";

  /** Specify the placeholder of the search field. */
  export let searchPlaceholder = "Search";

  /** Specify the message shown for a search that is not a valid pattern. */
  export let invalidRegexText = "Not a valid regular expression";

  /** Specify the label of the previous match button. */
  export let previousMatchText = "Previous match";

  /** Specify the label of the next match button. */
  export let nextMatchText = "Next match";

  /** Specify the label of the case-sensitive toggle. */
  export let caseSensitiveText = "Match case";

  /** Specify the label of the regular expression toggle. */
  export let regexText = "Use regular expression";

  /** Specify the label of the wrap toggle. */
  export let wrapText = "Wrap lines";

  /** Specify the label of the copy button. */
  export let copyButtonText = "Copy lines";

  /** Specify the text shown after copying. */
  export let copiedText = "Copied!";

  /** Specify the text shown when copying fails. */
  export let copyErrorText = "Failed to copy";

  /**
   * Specify the label of the level filter menu. While some levels are
   * hidden, it is followed by how many are shown, such as "(3/4)".
   */
  export let levelsLabelText = "Levels";

  /**
   * Specify the label of a level, in its column and its filter.
   * @type {(level: LogViewerLevel) => string}
   */
  export let levelText = defaultLevelText;

  /**
   * Specify the label of a line number button.
   * @type {(line: number) => string}
   */
  export let lineLabelText = defaultLineLabelText;

  /**
   * Specify the position of the current match, such as "3 of 12".
   * @type {(current: number, total: number) => string}
   */
  export let matchCountText = defaultMatchCountText;

  /** Specify the text shown when nothing matches. */
  export let noMatchesText = "No results";

  /**
   * Specify the label of the button that returns to the newest line.
   * @type {(newLines: number) => string}
   */
  export let jumpText = defaultJumpText;

  /**
   * Specify what is announced when `announce` is `"summary"`.
   * @type {(counts: { lines: number; errors: number; warnings: number }) => string}
   */
  export let summaryText = defaultSummaryText;

  /** Specify the text shown when there are no lines to show. */
  export let emptyText = "No log lines";

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import Search from "../Search/Search.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import DownToBottom from "../icons/DownToBottom.svelte";
  import LetterAa from "../icons/LetterAa.svelte";
  import RegularExpression from "../icons/RegularExpression.svelte";
  import TextWrap from "../icons/TextWrap.svelte";
  import { stripAnsi } from "../utils/ansi.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { relativeLuminance } from "../utils/color-contrast.js";
  import { copyText } from "../utils/copy-text.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    createLogBuffer,
    LOG_LEVELS,
    logRowText,
  } from "../utils/log-lines.js";
  import { createMatcher, createSearchIndex } from "../utils/log-search.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import LogViewerLineComponent from "./LogViewerLine.svelte";

  const ERROR_WORD = /\b(error|fatal|panic)\b/i;
  const WARNING_WORD = /\bwarn(ing)?\b/i;

  const CSS_NUMBER = /[\d.]+/g;

  /** Below this luminance the page behind the log is dark. */
  const DARK_LUMINANCE = 0.18;

  /** How near the end, in pixels, still counts as at the end. */
  const NEAR_END = 24;
  /** Rows rendered past each edge. Covers the lines of a fast stream. */
  const OVERSCAN = 40;
  /** The most rows rendered past an edge for a burst of lines. */
  const MAX_OVERSCAN = 120;

  /**
   * @param {{ id: number; occurrence: number } | null} match
   * @param {number} id
   * @returns {number} Which match of line `id` is the current one, or `-1`.
   */
  function occurrenceIn(match, id) {
    return match !== null && match.id === id ? match.occurrence : -1;
  }

  /** @param {import("../utils/log-lines.js").LogRow} row */
  function rowKey(row) {
    return row.id;
  }

  /** @param {LogViewerLevel} level */
  function defaultLevelText(level) {
    return level.toUpperCase();
  }

  /** @param {number} line */
  function defaultLineLabelText(line) {
    return `Line ${line}`;
  }

  /**
   * @param {number} current
   * @param {number} total
   */
  function defaultMatchCountText(current, total) {
    return `${current} of ${total}`;
  }

  /** @param {number} newLines */
  function defaultJumpText(newLines) {
    return newLines > 0 ? `Jump to latest (${newLines} new)` : "Jump to latest";
  }

  /** @param {{ lines: number; errors: number; warnings: number }} counts */
  function defaultSummaryText({ lines: added, errors, warnings }) {
    const parts = [`${added} new ${added === 1 ? "line" : "lines"}`];
    if (errors > 0)
      parts.push(`${errors} ${errors === 1 ? "error" : "errors"}`);
    if (warnings > 0) {
      parts.push(`${warnings} ${warnings === 1 ? "warning" : "warnings"}`);
    }
    return parts.join(", ");
  }

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /**
   * The toolbar's buttons, in order. The search field and its clear button
   * are text-field controls with their own tab stops, so they are left out.
   */
  const TOOL_SELECTOR =
    ".bx--log-viewer__search-options > button, .bx--log-viewer__group > button, .bx--toolbar-content > button";

  /** @type {null | HTMLDivElement} */
  let toolbarRef = null;
  /** Which toolbar button has the toolbar's one tab stop. */
  let toolStop = 0;

  function toolItems() {
    return /** @type {HTMLElement[]} */ (
      Array.from(toolbarRef?.querySelectorAll(TOOL_SELECTOR) ?? [])
    );
  }

  /** @param {FocusEvent} event */
  function handleToolFocus(event) {
    const index = toolItems().indexOf(
      /** @type {HTMLElement} */ (event.target),
    );
    if (index !== -1) toolStop = index;
  }

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  const buffer = createLogBuffer({ maxLines });
  const searchIndex = createSearchIndex();

  let view = buffer.view;
  let counts = { ...buffer.counts };
  /** Digits in the highest line number, which sets the width of the column. */
  let numberDigits = 1;
  let levelColumn = false;
  /** Characters in the longest level label, which sets the width of the column. */
  $: levelChars = Math.max(
    ...LOG_LEVELS.map((level) => String(levelText(level)).length),
  );
  /** Lines added since the reader scrolled away from the end. */
  let unseen = 0;
  let containerHeight = 320;
  let overscan = OVERSCAN;
  let rowHeight = 20;
  /** @type {number | null} */
  let backgroundLuminance = null;
  /** @type {null | HTMLDivElement} */
  let bodyRef = null;
  /** @type {null | HTMLElement} */
  let spacerRef = null;
  let mounted = false;
  /** Where the log was last scrolled to by the viewer itself. */
  let programmaticTop = -1;
  /** Changes when the log is sent somewhere else, which ends a scroll to a line in progress. */
  let scrollTarget = 0;
  let lastTop = 0;

  /** @type {ReturnType<typeof createMatcher>} */
  let matcher = null;
  let searchTotal = 0;
  let matchIndex = -1;
  /** @type {{ id: number; occurrence: number } | null} */
  let currentMatch = null;
  let searchStatus = "";
  /** The first line id the search index has not read. */
  let indexedUntil = 0;
  /**
   * Characters in the count's widest value for this total, such as "12 of
   * 12", which it reserves so the arrows after it do not move.
   */
  $: countChars =
    searchTotal > 0
      ? String(matchCountText(searchTotal, searchTotal)).length
      : 0;

  let announcement = "";
  let announcedLines = 0;
  let announcedErrors = 0;
  let announcedWarnings = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;
  /** @type {string[]} */
  let announcedText = [];

  let flushQueued = false;
  let pendingAdded = 0;
  /** @type {number} */
  let frame = 0;

  /** @type {ReadonlyArray<LogViewerLine>} */
  let knownLines = [];
  let knownLength = 0;
  /** How many lines the view held, and its first, when it was last drawn. */
  let shownLength = 0;
  let shownFirstId = -1;

  /**
   * Lines that arrived by `lines` read from the array, so only new ones are
   * parsed when it grows. An array grew when it kept the first and last of
   * the lines read before, or is the same array with more in it.
   * @param {ReadonlyArray<LogViewerLine>} next
   */
  function readLines(next) {
    const prev = knownLines;
    const prevLength = knownLength;
    knownLines = next;
    knownLength = next.length;

    const grew =
      next.length >= prevLength &&
      (prevLength === 0 ||
        next === prev ||
        (next[0] === prev[0] && next[prevLength - 1] === prev[prevLength - 1]));

    if (grew) {
      if (next.length > prevLength) {
        buffer.append(next.slice(prevLength));
        settle(next.length - prevLength);
      }
      return;
    }

    buffer.clear();
    buffer.append(next);
    unseen = 0;
    settle(next.length, true);
  }

  $: readLines(lines);

  /**
   * @param {number} limit
   * @param {boolean} wrapped
   * @param {boolean} following
   */
  function limitFor(limit, wrapped, following) {
    return wrapped && !following ? limit * 2 : limit;
  }

  $: if (buffer.setMaxLines(limitFor(maxLines, wrap, follow)) > 0) settle(0);

  /** @type {string} */
  let prevLevelsKey = LOG_LEVELS.join();
  $: levelsKey = LOG_LEVELS.filter((level) => levels.includes(level)).join();
  $: if (levelsKey !== prevLevelsKey) {
    prevLevelsKey = levelsKey;
    buffer.setLevels(
      new Set(LOG_LEVELS.filter((level) => levels.includes(level))),
    );
    settle(0, true);
  }

  /**
   * Take in what changed in the buffer: the view, the counts, the search
   * index, and where the reader is.
   * @param {number} added Lines that arrived.
   * @param {boolean} [rebuilt] Whether the view was rebuilt rather than
   * extended.
   */
  function settle(added, rebuilt = false) {
    const firstNew = indexedUntil;
    // The window is drawn for where the reader is, and then the log scrolls
    // to the lines that arrived. Rows past the edge keep that from showing
    // blank space, so a burst of more lines than OVERSCAN draws that many.
    overscan = mounted
      ? Math.min(MAX_OVERSCAN, Math.max(OVERSCAN, added + OVERSCAN / 4))
      : OVERSCAN;
    view = buffer.view;
    counts = { ...buffer.counts };
    numberDigits = String(Math.max(1, buffer.nextId)).length;
    levelColumn = buffer.leveled;

    const first = view.length > 0 ? view[0].id : buffer.nextId;
    /** @type {typeof view} */
    const fresh = [];
    for (let i = view.length - 1; i >= 0 && view[i].id >= firstNew; i--) {
      fresh.push(view[i]);
    }
    fresh.reverse();
    if (matcher && matcher !== "invalid") {
      if (rebuilt) {
        searchIndex.reset(matcher, view);
      } else {
        searchIndex.trim(first);
        searchIndex.append(fresh);
      }
    }
    indexedUntil = buffer.nextId;
    syncSearch();

    // Lines dropped from the front move everything up.
    const dropped = rebuilt ? 0 : shownLength + fresh.length - view.length;
    const moved = dropped > 0 && shownFirstId !== first;
    shownLength = view.length;
    shownFirstId = first;

    if (rebuilt) {
      if (follow) pin();
      return;
    }

    if (follow) {
      pin();
    } else if (added > 0 && mounted) {
      unseen += added;
      // Put the reader back on the lines they were reading. A wrapped row has
      // no known height, so a wrapped log keeps its lines instead.
      if (moved && !wrap && ref) {
        ref.scrollTop = Math.max(0, ref.scrollTop - dropped * rowHeight);
        programmaticTop = ref.scrollTop;
      }
    }
  }

  /**
   * Add lines to the end of the log. They are read now and drawn on the next
   * frame, so any number of calls in one frame cost one update.
   *
   * @type {(newLines: LogViewerLine | ReadonlyArray<LogViewerLine>) => void}
   */
  export function append(newLines) {
    const { added } = buffer.append(newLines);
    if (added > 0) {
      pendingAdded += added;
      announceLines(newLines);
    }
    queueFlush();
  }

  /**
   * Remove every line.
   * @returns {void}
   */
  export function clear() {
    buffer.clear();
    pendingAdded = 0;
    unseen = 0;
    knownLines = lines;
    knownLength = lines.length;
    selection = null;
    indexedUntil = buffer.nextId;
    settle(0, true);
  }

  function queueFlush() {
    if (flushQueued) return;
    flushQueued = true;
    frame = requestAnimationFrame(flush);
  }

  function flush() {
    flushQueued = false;
    const added = pendingAdded;
    pendingAdded = 0;
    settle(added);
  }

  /**
   * Scroll to the line with this number, which starts at 1, and stop
   * following the log.
   *
   * @type {(line: number) => void}
   */
  export function scrollToLine(line) {
    revealLine(line - 1);
  }

  /**
   * Scroll to the newest line and follow the log from there.
   * @returns {void}
   */
  export function scrollToEnd() {
    scrollTarget++;
    follow = true;
    pin();
  }

  /**
   * The text of the selected lines, or of every line shown when none is
   * selected, without colors.
   * @type {() => string}
   */
  export function getText() {
    return selectedRows().map(logRowText).join("\n");
  }

  /**
   * Copy the selected lines, or every line shown, to the clipboard.
   * @returns {Promise<void>}
   */
  export async function copy() {
    await copyText(getText());
  }

  /**
   * Go to the next match of the search.
   * @returns {void}
   */
  export function findNext() {
    stepMatch(1);
  }

  /**
   * Go to the previous match of the search.
   * @returns {void}
   */
  export function findPrevious() {
    stepMatch(-1);
  }

  /**
   * @param {number} id
   * @returns {number} The position of the first line at or after `id`, which
   * is the line count when there is none.
   */
  function indexOfId(id) {
    let low = 0;
    let high = view.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (view[mid].id < id) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  function selectedRows() {
    if (!selection) return view;
    const start = indexOfId(Math.min(selection.start, selection.end));
    const end = indexOfId(Math.max(selection.start, selection.end) + 1);
    return view.slice(start, end);
  }

  /**
   * Bring a line into the middle of the log. A wrapped log only estimates how
   * tall the lines above it are, so it scrolls to the estimate, then to the
   * line itself once the window has drawn it.
   *
   * @param {number} id
   */
  async function revealLine(id) {
    if (!ref || view.length === 0) return;
    const index = Math.min(indexOfId(id), view.length - 1);
    const target = ++scrollTarget;
    follow = false;

    for (let attempt = 0; attempt < 6; attempt++) {
      if (!ref || target !== scrollTarget) return;
      const line = ref.querySelector(`[data-line-id="${view[index].id}"]`);
      if (line instanceof HTMLElement) {
        const box = ref.getBoundingClientRect();
        const rect = line.getBoundingClientRect();
        const shift = rect.top + rect.height / 2 - (box.top + box.height / 2);
        if (Math.abs(shift) < 1) return;
        ref.scrollTop += shift;
      } else {
        const average = ref.scrollHeight / Math.max(1, view.length);
        ref.scrollTop = Math.max(0, index * average - ref.clientHeight / 2);
      }
      programmaticTop = ref.scrollTop;
      // biome-ignore lint/performance/noAwaitInLoops: each pass reads what the last one drew.
      await tick();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  /** Keep the log at its end, once what was added has been drawn. */
  async function pin() {
    await tick();
    if (!ref || !follow) return;
    const end = ref.scrollHeight - ref.clientHeight;
    if (Math.abs(ref.scrollTop - end) < 0.5) return;
    ref.scrollTop = end;
    programmaticTop = ref.scrollTop;
  }

  /** @type {boolean} */
  let prevFollow = follow;
  $: if (follow !== prevFollow) {
    prevFollow = follow;
    if (follow) {
      scrollTarget++;
      unseen = 0;
      pin();
    }
  }

  function handleScroll() {
    if (!ref) return;
    const top = ref.scrollTop;
    const gap = ref.scrollHeight - top - ref.clientHeight;
    const own = Math.abs(top - programmaticTop) < 1;
    if (!own) {
      if (gap <= NEAR_END) {
        if (!follow) follow = true;
      } else if (top < lastTop - 0.5 && follow) {
        follow = false;
      }
    }
    lastTop = top;
  }

  /** @param {WheelEvent} event */
  function handleWheel(event) {
    scrollTarget++;
    if (event.deltaY < 0 && follow) follow = false;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.target !== ref) return;
    scrollTarget++;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selectAll();
    } else if (modifier && event.key.toLowerCase() === "c" && selection) {
      event.preventDefault();
      copy().then(
        () => dispatchCopy(),
        (error) => dispatchCopyError(error),
      );
    } else if (event.key === "Escape" && selection) {
      selection = null;
    } else if (
      (event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "Home") &&
      follow
    )
      follow = false;
  }

  function selectAll() {
    selection =
      view.length > 0
        ? { start: view[0].id, end: view[view.length - 1].id }
        : null;
  }

  /** @param {CustomEvent<{ id: number; extend: boolean }>} event */
  function handleSelect(event) {
    const { id, extend } = event.detail;
    if (extend && selection) {
      selection = { start: selection.start, end: id };
    } else if (selection && selection.start === id && selection.end === id) {
      selection = null;
    } else {
      selection = { start: id, end: id };
    }
  }

  /**
   * @param {number} id
   * @param {LogViewerSelection | null} range
   */
  function inRange(id, range) {
    return (
      range !== null &&
      id >= Math.min(range.start, range.end) &&
      id <= Math.max(range.start, range.end)
    );
  }

  function dispatchCopy() {
    dispatch("copy", { lineCount: selectedRows().length });
  }

  /** @param {unknown} error */
  function dispatchCopyError(error) {
    dispatch("copy:error", { error });
  }

  async function copyFromButton() {
    await copy();
  }

  // Search

  /**
   * @param {ReturnType<typeof createMatcher>} next
   * @param {string} _key What else the search depends on, so it reads again.
   */
  function resetSearch(next, _key) {
    searchIndex.reset(next === "invalid" ? null : next, view);
    indexedUntil = buffer.nextId;
    currentMatch = null;
    matchIndex = searchIndex.total > 0 ? 0 : -1;
    syncSearch();
  }

  $: matcher = createMatcher({ query, regex, caseSensitive });
  $: invalid = matcher === "invalid";
  $: activeMatcher = matcher === "invalid" ? null : matcher;

  let prevMatcherKey = "";
  $: matcherKey = `${query}\u0000${regex}\u0000${caseSensitive}`;
  $: if (matcherKey !== prevMatcherKey) {
    prevMatcherKey = matcherKey;
    resetSearch(matcher, levelsKey);
    if (searchTotal > 0) {
      matchIndex = searchIndex.firstFrom(topId());
      currentMatch = null;
      const found = syncSearch();
      if (mounted && found) revealLine(found.id);
    }
    searchStatus =
      query === "" || invalid
        ? ""
        : searchTotal > 0
          ? matchCountText(matchIndex + 1, searchTotal)
          : noMatchesText;
  }

  /** @returns {number} The id of the first line in view. */
  function topId() {
    if (!ref || view.length === 0) return 0;
    const average = ref.scrollHeight / view.length;
    const index = average > 0 ? Math.floor(ref.scrollTop / average) : 0;
    return view[Math.min(view.length - 1, Math.max(0, index))].id;
  }

  /** @returns {{ id: number; occurrence: number } | null} The current match. */
  function syncSearch() {
    searchTotal = searchIndex.total;
    if (searchTotal === 0) {
      matchIndex = -1;
      currentMatch = null;
      return null;
    }
    // Lines dropped from the front renumber the matches: keep the current
    // one where it is.
    if (currentMatch && view.length > 0 && currentMatch.id >= view[0].id) {
      matchIndex = searchIndex.position(
        currentMatch.id,
        currentMatch.occurrence,
      );
    }
    matchIndex = Math.min(Math.max(matchIndex, 0), searchTotal - 1);
    currentMatch = searchIndex.locate(matchIndex);
    return currentMatch;
  }

  /** @param {number} step */
  function stepMatch(step) {
    if (searchTotal === 0) return;
    matchIndex = (matchIndex + step + searchTotal) % searchTotal;
    currentMatch = searchIndex.locate(matchIndex);
    searchStatus = matchCountText(matchIndex + 1, searchTotal);
    if (currentMatch) revealLine(currentMatch.id);
  }

  /** @param {KeyboardEvent} event */
  function handleSearchKeydown(event) {
    if (event.key !== "Enter" || isImeComposition(event)) return;
    stepMatch(event.shiftKey ? -1 : 1);
  }

  /**
   * @param {LogViewerLevel} level
   * @param {boolean} shown
   */
  function toggleLevel(level, shown) {
    levels = shown
      ? LOG_LEVELS.filter((name) => name === level || levels.includes(name))
      : levels.filter((name) => name !== level);
  }

  // Announcements

  /** @param {LogViewerLine | ReadonlyArray<LogViewerLine>} newLines */
  function announceLines(newLines) {
    if (announce === "off") return;
    const batch = Array.isArray(newLines) ? newLines : [newLines];
    for (const line of batch) {
      announcedLines++;
      const level =
        typeof line === "string" ? undefined : String(line.level ?? "");
      const text = typeof line === "string" ? line : String(line.text ?? "");
      if (announce === "lines" && announcedText.length < 5) {
        announcedText.push(stripAnsi(text));
      }
      // The counts need a level, which a string line carries in its text.
      if (level === "error" || ERROR_WORD.test(text)) {
        announcedErrors++;
      } else if (level === "warn" || WARNING_WORD.test(text)) {
        announcedWarnings++;
      }
    }
    if (announceTimer === undefined) {
      announceTimer = setTimeout(sendAnnouncement, announceInterval);
    }
  }

  function sendAnnouncement() {
    announceTimer = undefined;
    announcement =
      announce === "lines"
        ? announcedText.join(". ")
        : summaryText({
            lines: announcedLines,
            errors: announcedErrors,
            warnings: announcedWarnings,
          });
    announcedLines = announcedErrors = announcedWarnings = 0;
    announcedText = [];
  }

  // Page colors

  function readBackground() {
    if (!ref) return;
    const channels = getComputedStyle(ref).backgroundColor.match(CSS_NUMBER);
    if (!channels || channels.length < 3) return;
    const [r, g, b] = channels.slice(0, 3).map((value) => Number(value) / 255);
    backgroundLuminance = relativeLuminance([r, g, b]);
  }

  function readRowHeight() {
    if (!ref) return;
    const lineHeight = Number.parseFloat(getComputedStyle(ref).lineHeight);
    if (lineHeight > 0) rowHeight = lineHeight;
  }

  onMount(() => {
    mounted = true;
    readRowHeight();
    readBackground();
    const theme = new MutationObserver(readBackground);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "theme", "style"],
    });

    /** @type {Array<() => void>} */
    const stops = [];
    if (bodyRef) {
      stops.push(
        observeResize(bodyRef, (entry) => {
          const next = Math.floor(entry.contentRect.height);
          if (next > 0 && next !== containerHeight) containerHeight = next;
          if (follow) pin();
        }),
      );
    }
    if (ref) {
      ref.addEventListener("scroll", handleScroll, { passive: true });
      ref.addEventListener("keydown", handleKeydown);
      ref.addEventListener("wheel", handleWheel, { passive: true });
      lastTop = ref.scrollTop;
      spacerRef = /** @type {HTMLElement | null} */ (ref.firstElementChild);
      if (spacerRef) {
        // Wrapped lines settle to their real height after they are drawn,
        // which grows the log under a reader who is following it.
        stops.push(
          observeResize(spacerRef, () => {
            if (follow) pin();
          }),
        );
      }
    }
    if (follow) pin();

    return () => {
      mounted = false;
      theme.disconnect();
      for (const stop of stops) stop();
      ref?.removeEventListener("scroll", handleScroll);
      ref?.removeEventListener("keydown", handleKeydown);
      ref?.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(frame);
      clearTimeout(announceTimer);
    };
  });
</script>

<div
  {id}
  class:bx--log-viewer={true}
  class:bx--log-viewer--wrap={wrap}
  class:bx--log-viewer--dark={backgroundLuminance !== null &&
    backgroundLuminance < DARK_LUMINANCE}
  style:height
  style:--ccs-log-number-width="{numberDigits}ch"
  style:--ccs-log-level-chars={levelChars}
  {...wrapperProps}
>
  {#if !hideToolbar}
    <!-- DataTable's toolbar layout: items fill its height, and the search
         field's bottom edge is the toolbar's border. -->
    <!-- The buttons share one tab stop and arrow keys move between them, as
         in a toolbar. The search field keeps its own tab stop before them,
         since its arrow keys move the caret. -->
    <div
      bind:this={toolbarRef}
      class:bx--table-toolbar={true}
      class:bx--table-toolbar--small={true}
      class:bx--log-viewer__toolbar={true}
      role="toolbar"
      aria-label={toolbarLabelText}
      use:rovingFocus={{
        selector: TOOL_SELECTOR,
        getItems: toolItems,
        itemsOnly: true,
        rtl: () =>
          resolveLayoutDirection($layoutDirection, toolbarRef) === "rtl",
        getActiveIndex: () => toolStop,
        onMove: (index, event) => {
          if (hasModifierKey(event)) return;
          event.preventDefault();
          toolStop = index;
          toolItems()[index]?.focus();
        },
      }}
      on:focusin={handleToolFocus}
    >
      <div class:bx--toolbar-content={true}>
        <!-- The toggles change how the query is read, so they sit in the
             field, after the clear button. -->
        <div class:bx--log-viewer__search={true}>
          <Search
            size="sm"
            id="{id}-search"
            searchClass="bx--toolbar-search-container-persistent"
            bind:value={query}
            labelText={searchLabelText}
            hideLabel
            placeholder={searchPlaceholder}
            {invalid}
            on:keydown={handleSearchKeydown}
          />
          <div class:bx--log-viewer__search-options={true}>
            <Button
              kind="ghost"
              size="sm"
              tabindex={toolStop === 0 ? "0" : "-1"}
              icon={LetterAa}
              iconDescription={caseSensitiveText}
              isSelected={caseSensitive}
              on:click={() => (caseSensitive = !caseSensitive)}
            />
            <Button
              kind="ghost"
              size="sm"
              tabindex={toolStop === 1 ? "0" : "-1"}
              icon={RegularExpression}
              iconDescription={regexText}
              isSelected={regex}
              on:click={() => (regex = !regex)}
            />
          </div>
        </div>
        <div class:bx--log-viewer__group={true}>
          <span
            class:bx--log-viewer__count={true}
            style:--ccs-log-count-width="{countChars}ch"
            aria-hidden="true"
          >
            <!-- The count has letters, so its direction follows its own text: "1 of 12" stays in order on an RTL page. -->
            <bdi>
              {#if invalid}
                {invalidRegexText}
              {:else if query !== ""}
                {searchTotal > 0
                  ? matchCountText(matchIndex + 1, searchTotal)
                  : noMatchesText}
              {/if}
            </bdi>
          </span>
          <Button
            kind="ghost"
            size="sm"
            tabindex={toolStop === 2 ? "0" : "-1"}
            icon={ArrowUp}
            iconDescription={previousMatchText}
            aria-disabled={searchTotal === 0 ? "true" : undefined}
            on:click={() => stepMatch(-1)}
          />
          <Button
            kind="ghost"
            size="sm"
            tabindex={toolStop === 3 ? "0" : "-1"}
            icon={ArrowDown}
            iconDescription={nextMatchText}
            aria-disabled={searchTotal === 0 ? "true" : undefined}
            on:click={() => stepMatch(1)}
          />
        </div>
        <!-- A menu of checkable levels, each with its count, as DataTable's
             column visibility menu does. The label shows how many are on
             while some are off. -->
        <MenuButton
          tabindex={toolStop === 4 ? "0" : "-1"}
          kind="ghost"
          size="sm"
          labelText={levels.length < LOG_LEVELS.length
            ? `${levelsLabelText} (${levels.length}/${LOG_LEVELS.length})`
            : levelsLabelText}
        >
          {#each LOG_LEVELS as level (level)}
            <MenuItem
              selectable
              labelText={levelText(level)}
              shortcutText={String(counts[level])}
              selected={levels.includes(level)}
              on:click={(event) => {
                event.preventDefault();
                toggleLevel(level, !levels.includes(level));
              }}
            />
          {/each}
        </MenuButton>
        <div
          class:bx--log-viewer__group={true}
          class:bx--log-viewer__actions={true}
        >
          <Button
            kind="ghost"
            size="sm"
            tabindex={toolStop === 5 ? "0" : "-1"}
            icon={TextWrap}
            iconDescription={wrapText}
            isSelected={wrap}
            on:click={() => (wrap = !wrap)}
          />
          <CopyButton
            tabindex={toolStop === 6 ? "0" : "-1"}
            kind="ghost"
            size="sm"
            iconDescription={copyButtonText}
            feedback={copiedText}
            errorFeedback={copyErrorText}
            copy={copyFromButton}
            on:copy={dispatchCopy}
            on:copy:error={(event) => dispatchCopyError(event.detail.error)}
          />
        </div>
      </div>
    </div>
  {/if}
  <div bind:this={bodyRef} class:bx--log-viewer__body={true}>
    <VirtualList
      bind:ref
      items={view}
      itemHeight={rowHeight}
      {containerHeight}
      {overscan}
      measured={wrap}
      getKey={rowKey}
      class="bx--log-viewer__scroller"
      role="log"
      aria-label={ariaLabel ?? (labelText || undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-live="off"
      tabindex={0}
      let:item
    >
      <LogViewerLineComponent
        row={item}
        matcher={activeMatcher}
        current={occurrenceIn(currentMatch, item.id)}
        {lineNumbers}
        {timestamps}
        {levelColumn}
        {links}
        selected={inRange(item.id, selection)}
        {backgroundLuminance}
        {minContrast}
        {levelText}
        {lineLabelText}
        on:select={handleSelect}
      />
    </VirtualList>
    {#if view.length === 0}
      <div class:bx--log-viewer__empty={true}>{emptyText}</div>
    {/if}
    {#if !follow && view.length > 0}
      <div class:bx--log-viewer__jump={true}>
        <Button
          kind="secondary"
          size="sm"
          icon={DownToBottom}
          on:click={scrollToEnd}>{jumpText(unseen)}</Button
        >
      </div>
    {/if}
  </div>
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {searchStatus}
  </div>
</div>
