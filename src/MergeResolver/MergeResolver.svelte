<script>
  /**
   * @typedef {"unresolved" | "ours" | "theirs" | "both" | "both-reversed" | "base" | "edited"} MergeResolverStatus
   * @typedef {"ours" | "theirs" | "both" | "both-reversed" | "base"} MergeResolverChoice
   * @typedef {{ text: string; remaining: number; conflicts: number }} MergeResolverDetail
   * @typedef {{ next: string | string[]; previous: string | string[]; ours: string | string[]; theirs: string | string[]; both: string | string[]; bothReversed: string | string[]; base: string | string[]; undo: string | string[]; redo: string | string[]; resolve: string | string[] }} MergeResolverShortcuts
   * @restProps {div}
   * @event {MergeResolverDetail} resolve - Fires when the user marks the merge resolved, once no conflict has its markers. Cancelable: call `preventDefault()` to keep it unresolved. `detail.text` is the final text.
   * @event {MergeResolverDetail} change - Fires after the result changes, by typing, accepting or undoing.
   */

  /**
   * Specify the common ancestor text. With `ours` and `theirs`, the
   * component merges the three by lines (diff3). Ignored when `conflicted`
   * is set.
   */
  export let base = "";

  /** Specify the text of our side, the one being merged into. */
  export let ours = "";

  /** Specify the text of their side, the one being merged in. */
  export let theirs = "";

  /**
   * Specify one file with git conflict markers (`<<<<<<<`, `|||||||`,
   * `=======`, `>>>>>>>`) instead of `base`, `ours` and `theirs`. A
   * conflict without a `|||||||` section has no base to accept.
   * @type {string | undefined}
   */
  export let conflicted = undefined;

  /**
   * The merged text, with the line ending the inputs used and with the
   * markers of any conflict not yet resolved.
   * @bindable readonly
   */
  export let result = "";

  /**
   * Set the index of the current conflict, from 0, or -1 when there are
   * none. It moves with navigation and with the caret in the result.
   * @bindable writable
   */
  export let current = -1;

  /**
   * Whether the user has marked the merge resolved. Any change after
   * that puts it back to `false`.
   * @bindable readonly
   */
  export let resolved = false;

  /**
   * Specify the language for syntax highlighting, as `tokenize` knows it.
   * @type {string | undefined}
   */
  export let language = undefined;

  /**
   * Specify how to split code into highlighted runs, such as `tokenize`
   * from `carbon-components-svelte/syntax`. The core does not import the
   * highlighter, so without it the code is plain.
   * @type {((code: string, language: string) => ReadonlyArray<{ type: string | null; text: string }> | undefined) | undefined}
   */
  export let tokenize = undefined;

  /**
   * Specify the layout. `"columns"` puts ours, the result and theirs side
   * by side; `"stacked"` puts ours and theirs above the result; `"tabs"`
   * shows one at a time. `"auto"` picks by the width of the component.
   * @type {"auto" | "columns" | "stacked" | "tabs"}
   */
  export let layout = "auto";

  /** Specify the height of the panes as a CSS length. */
  export let height = "32rem";

  /** Set to `false` to leave out the marks on changed words in conflicts. */
  export let wordMarks = true;

  /** Set to `false` to stay on the conflict after accepting it. */
  export let advanceOnAccept = true;

  /**
   * Override the key combinations, such as `{ ours: "alt+1" }`. Keys not
   * given keep their defaults.
   * @type {Partial<MergeResolverShortcuts>}
   */
  export let shortcuts = {};

  /** Specify the accessible name of the whole resolver. */
  export let labelText = "Merge conflicts";

  /** Specify the title of our pane. */
  export let oursLabel = "Ours";

  /** Specify the title of their pane. */
  export let theirsLabel = "Theirs";

  /** Specify the title of the result pane. */
  export let resultLabel = "Result";

  /** Specify the accessible name of the group of conflict actions. */
  export let actionsLabel = "Conflict actions";

  /** Specify the text of the previous-conflict button. */
  export let previousText = "Previous conflict";

  /** Specify the text of the next-conflict button. */
  export let nextText = "Next conflict";

  /** Specify the text of the accept-ours button. */
  export let acceptOursText = "Accept ours";

  /** Specify the text of the accept-theirs button. */
  export let acceptTheirsText = "Accept theirs";

  /** Specify the text of the accept-both button (ours first). */
  export let acceptBothText = "Accept both";

  /** Specify the text of the accept-both button (theirs first). */
  export let acceptBothReversedText = "Both, theirs first";

  /** Specify the text of the accept-base button. */
  export let acceptBaseText = "Accept base";

  /** Specify the text of the undo button. */
  export let undoText = "Undo";

  /** Specify the text of the redo button. */
  export let redoText = "Redo";

  /** Specify the text of the button that marks the merge resolved. */
  export let resolveText = "Mark as resolved";

  /** Specify the text shown, and announced, once the merge is resolved. */
  export let resolvedText = "Merge resolved";

  /** Specify the text shown when there is nothing to resolve. */
  export let noConflictsText = "No conflicts";

  /** Specify the text shown beside a side with no lines in a conflict. */
  export let emptySideText = "No lines";

  /** Specify the text announced after an undo. */
  export let undoneText = "Undid the last change";

  /** Specify the text announced after a redo. */
  export let redoneText = "Redid the change";

  /** Specify the name of the shortcuts list. */
  export let shortcutsText = "Keyboard shortcuts";

  /** Specify the names of the panes on the tab buttons. */
  export let paneSwitcherLabel = "Pane";

  /**
   * Specify the text for a conflict's position, such as "Conflict 3 of 7".
   * @type {(position: number, total: number) => string}
   */
  export let conflictText = function conflictText(position, total) {
    return `Conflict ${position} of ${total}`;
  };

  /**
   * Specify the text for how a conflict stands.
   * @type {(status: MergeResolverStatus) => string}
   */
  export let statusText = function statusText(status) {
    switch (status) {
      case "ours":
        return "accepted ours";
      case "theirs":
        return "accepted theirs";
      case "both":
        return "accepted both, ours first";
      case "both-reversed":
        return "accepted both, theirs first";
      case "base":
        return "accepted base";
      case "edited":
        return "edited manually";
      default:
        return "unresolved";
    }
  };

  /**
   * Specify the text for how many conflicts are left.
   * @type {(remaining: number) => string}
   */
  export let remainingText = function remainingText(remaining) {
    if (remaining === 0) return "All conflicts resolved";
    return remaining === 1
      ? "1 conflict remaining"
      : `${remaining} conflicts remaining`;
  };

  /**
   * Specify an `id`; the ids of the parts derive from it.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Undo from "../icons/Undo.svelte";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    matchesShortcut,
  } from "../utils/keyboard-shortcut.js";
  import {
    acceptChunk,
    applyEntry,
    chunkAt,
    chunkLineStarts,
    chunkOffsets,
    chunkStatus,
    coalesceEntries,
    conflictIndexes,
    createMergeResult,
    diffRange,
    editText,
    invertEntry,
    neighborConflict,
    resultText,
  } from "../utils/merge-result.js";
  import {
    buildSideRows,
    cutTokenLines,
    mapScroll,
  } from "../utils/merge-view.js";
  import { merge3, parseConflictMarkers } from "../utils/merge3.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import MergeResolverResult from "./MergeResolverResult.svelte";
  import MergeResolverSide from "./MergeResolverSide.svelte";

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId("ccs-merge-");
  const MARKER = /^(<{7}|={7}|>{7})( |$)/;
  /** Past this many characters, the result is highlighted after a pause. */
  const SYNC_HIGHLIGHT_LIMIT = 60_000;
  const MAX_HISTORY = 200;
  const COALESCE_MS = 1000;

  /** @type {MergeResolverShortcuts} */
  const DEFAULT_SHORTCUTS = {
    next: "f7",
    previous: "shift+f7",
    ours: "alt+o",
    theirs: "alt+t",
    both: "alt+b",
    bothReversed: "alt+shift+b",
    base: "alt+shift+o",
    undo: "mod+z",
    redo: ["mod+shift+z", "ctrl+y"],
    resolve: "mod+enter",
  };

  /** @type {import("../utils/merge3.js").MergeModel} */
  let model;
  /** @type {import("../utils/merge-result.js").MergeResult} */
  let merged;
  let seedText = "";
  let lastValue = "";
  let rev = 0;
  /** @type {import("../utils/merge-result.js").HistoryEntry[]} */
  let history = [];
  let historyIndex = 0;
  let lastEditAt = 0;
  let canUndo = false;
  let canRedo = false;
  /** @type {null | number} */
  let selectionBefore = null;
  let announcement = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;
  let mounted = false;
  /**
   * The summary the last `change` event, or the first paint, reported.
   * @type {null | ReturnType<typeof summarize>}
   */
  let notified = null;

  /** @type {null | HTMLDivElement} */
  let oursEl = null;
  /** @type {null | HTMLDivElement} */
  let theirsEl = null;
  /** @type {null | HTMLTextAreaElement} */
  let resultEl = null;
  /** @type {null | HTMLElement} */
  let probeEl = null;
  let rowHeight = 20;
  let rootWidth = 0;
  /** @type {"ours" | "result" | "theirs"} */
  let activePane = "result";

  /** @type {null | Array<Array<[string | null, string]>>} */
  let oursTokens = null;
  /** @type {null | Array<Array<[string | null, string]>>} */
  let theirsTokens = null;
  /** @type {null | Array<Array<[string | null, string]>>} */
  let resultTokens = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let highlightTimer;

  $: rootId = id ?? fallbackId;
  $: keys = { ...DEFAULT_SHORTCUTS, ...shortcuts };

  $: model =
    conflicted === undefined
      ? merge3(base, ours, theirs)
      : parseConflictMarkers(conflicted);
  $: reset(model);

  /** @param {import("../utils/merge3.js").MergeModel} next */
  function reset(next) {
    merged = createMergeResult(next);
    seedText = resultText(merged);
    lastValue = seedText;
    history = [];
    historyIndex = 0;
    canUndo = false;
    canRedo = false;
    rev++;
    const list = conflictIndexes(merged);
    if (!(current >= 0 && current < list.length)) {
      const first = list.findIndex(
        (i) => chunkStatus(merged, i) === "unresolved",
      );
      current = list.length === 0 ? -1 : Math.max(first, 0);
    }
    revealed = current;
    resolved = false;
  }

  /**
   * @param {import("../utils/merge-result.js").MergeResult} m
   * @param {number} _rev
   */
  function summarize(m, _rev) {
    const text = resultText(m);
    const statuses = m.chunks.map((_, i) => chunkStatus(m, i));
    const conflicts = conflictIndexes(m);
    return {
      text,
      output: m.eol === "\r\n" ? text.replace(/\n/g, "\r\n") : text,
      statuses,
      conflicts,
      remaining: conflicts.filter((i) => statuses[i] === "unresolved").length,
      offsets: chunkOffsets(m),
      lineStarts: chunkLineStarts(m),
    };
  }

  $: summary = summarize(merged, rev);
  $: result = summary.output;
  $: conflicts = summary.conflicts;
  $: total = conflicts.length;
  $: remaining = summary.remaining;
  $: currentChunk = current >= 0 && current < total ? conflicts[current] : -1;
  $: resultLines = summary.text.split("\n");
  $: lineCount = resultLines.length;

  $: oursSide = buildSideRows(merged.chunks, "ours");
  $: theirsSide = buildSideRows(merged.chunks, "theirs");
  $: digits = String(
    Math.max(lineCount, oursSide.rows.length, theirsSide.rows.length),
  ).length;

  $: if (mounted) notifyChange(summary);

  /** @param {typeof summary} s */
  function notifyChange(s) {
    if (s === notified) return;
    notified = s;
    dispatch("change", {
      text: s.output,
      remaining: s.remaining,
      conflicts: s.conflicts.length,
    });
  }

  $: mode =
    layout === "auto"
      ? rootWidth === 0 || rootWidth >= 1056
        ? "columns"
        : rootWidth >= 672
          ? "stacked"
          : "tabs"
      : layout;
  $: tabbed = mode === "tabs";

  $: heads = merged.chunks.map((_chunk, i) => {
    const position = conflicts.indexOf(i);
    return position === -1
      ? undefined
      : {
          label: conflictText(position + 1, total),
          statusText: statusText(
            /** @type {MergeResolverStatus} */ (summary.statuses[i]),
          ),
          number: position + 1,
        };
  });

  // Highlighting. The sides are cut once, after first paint; the result is
  // cut again on every change, at once when it is small and after a pause
  // when it is not, since a stale cut would color the wrong lines.
  /**
   * @param {string} code
   * @param {typeof tokenize} tokenizer
   * @param {string | undefined} lang
   * @returns {null | Array<Array<[string | null, string]>>}
   */
  function cut(code, tokenizer, lang) {
    if (!tokenizer || !lang) return null;
    const tokens = tokenizer(code, lang);
    return tokens ? cutTokenLines(tokens) : null;
  }

  /** @param {import("../utils/merge-view.js").SideRow[]} rows */
  function sideCode(rows) {
    return rows
      .filter((row) => row.kind === "line")
      .map((row) => row.text)
      .join("\n");
  }

  /**
   * @param {string[]} lines
   * @param {typeof summary} s
   */
  function resultCode(lines, s) {
    const copy = lines.slice();
    s.statuses.forEach((status, i) => {
      if (status !== "unresolved") return;
      const stop = Math.min(s.lineStarts[i + 1], copy.length - 1);
      for (let line = s.lineStarts[i]; line <= stop; line++) {
        if (MARKER.test(copy[line])) copy[line] = "";
      }
    });
    return copy.join("\n");
  }

  $: if (mounted) {
    oursTokens = cut(sideCode(oursSide.rows), tokenize, language);
    theirsTokens = cut(sideCode(theirsSide.rows), tokenize, language);
  }

  $: if (mounted) scheduleHighlight(tokenize, language, summary, resultLines);

  /**
   * @param {unknown} _tokenize
   * @param {unknown} _language
   * @param {typeof summary} s
   * @param {string[]} lines
   */
  function scheduleHighlight(_tokenize, _language, s, lines) {
    clearTimeout(highlightTimer);
    if (!tokenize || !language) {
      resultTokens = null;
      return;
    }
    if (s.text.length <= SYNC_HIGHLIGHT_LIMIT) {
      resultTokens = cut(resultCode(lines, s), tokenize, language);
      return;
    }
    resultTokens = null;
    highlightTimer = setTimeout(() => {
      resultTokens = cut(resultCode(lines, s), tokenize, language);
    }, 150);
  }

  // Scroll sync. Every pane maps its position to the others by chunk: where
  // a chunk starts in each pane is an anchor, and a position between two
  // anchors carries over by its fraction.
  $: anchors = {
    ours: oursSide.starts.map((row) => row * rowHeight),
    theirs: theirsSide.starts.map((row) => row * rowHeight),
    result: [...summary.lineStarts.slice(0, -1), lineCount - 1].map(
      (line) => line * rowHeight,
    ),
  };

  const PANES = /** @type {const} */ (["ours", "result", "theirs"]);
  const expected = {
    ours: Number.NaN,
    result: Number.NaN,
    theirs: Number.NaN,
  };
  /** @type {{ pane: "ours" | "result" | "theirs", y: number }} */
  let lastLocation = { pane: "result", y: 0 };

  /** @param {"ours" | "result" | "theirs"} pane */
  function elementOf(pane) {
    return pane === "ours" ? oursEl : pane === "theirs" ? theirsEl : resultEl;
  }

  // Spelled out so the template sees what it depends on.
  $: visible = {
    ours: !tabbed || activePane === "ours",
    result: !tabbed || activePane === "result",
    theirs: !tabbed || activePane === "theirs",
  };

  /** @param {"ours" | "result" | "theirs"} pane */
  function shown(pane) {
    return visible[pane];
  }

  // Navigation lines a conflict up at the same height in every pane, which
  // chunk-by-chunk mapping alone does not (a conflict's action row adds
  // lines to the sides). `shift` keeps that offset as the panes scroll
  // together, until they have moved a viewport away from it.
  const shift = { ours: 0, result: 0, theirs: 0 };
  let alignedAt = Number.NaN;

  /** @param {"ours" | "result" | "theirs"} pane */
  function syncFrom(pane) {
    const el = elementOf(pane);
    if (!el) return;
    const y = el.scrollTop;
    if (Math.abs(y - expected[pane]) < 1) {
      expected[pane] = Number.NaN;
      return;
    }
    expected[pane] = Number.NaN;
    lastLocation = { pane, y };
    const resultY =
      pane === "result"
        ? y
        : mapScroll(anchors[pane], anchors.result, y - shift[pane]);
    if (Math.abs(resultY - alignedAt) > el.clientHeight * 1.5) {
      shift.ours = 0;
      shift.theirs = 0;
      alignedAt = Number.NaN;
    }
    for (const other of PANES) {
      const target = elementOf(other);
      if (other === pane || !target || !shown(other)) continue;
      const next =
        other === "result"
          ? resultY
          : mapScroll(anchors.result, anchors[other], resultY) + shift[other];
      if (Math.abs(target.scrollTop - next) < 1) continue;
      target.scrollTop = next;
      expected[other] = target.scrollTop;
    }
  }

  async function restoreScroll() {
    await Promise.resolve();
    const target = elementOf(activePane);
    if (!target) return;
    const next = mapScroll(
      anchors[lastLocation.pane],
      anchors[activePane],
      lastLocation.y,
    );
    target.scrollTop = next;
    expected[activePane] = target.scrollTop;
  }

  /** @param {"ours" | "result" | "theirs"} pane */
  function showPane(pane) {
    activePane = pane;
    restoreScroll();
  }

  // Navigation.
  let revealed = -1;

  /** @param {number} chunk */
  function reveal(chunk) {
    if (chunk < 0) return;
    for (const pane of PANES) {
      const el = elementOf(pane);
      if (!el || !shown(pane)) continue;
      const before = el.scrollTop;
      el.scrollTop = Math.max(0, anchors[pane][chunk] - el.clientHeight * 0.3);
      if (Math.abs(el.scrollTop - before) >= 1) expected[pane] = el.scrollTop;
    }
    if (resultEl && shown("result")) {
      const top = resultEl.scrollTop;
      alignedAt = top;
      for (const pane of /** @type {const} */ (["ours", "theirs"])) {
        const el = elementOf(pane);
        shift[pane] = el
          ? el.scrollTop - mapScroll(anchors.result, anchors[pane], top)
          : 0;
      }
      lastLocation = { pane: "result", y: top };
      if (document.activeElement === resultEl) {
        const offset = summary.offsets[chunk];
        resultEl.setSelectionRange(offset, offset);
      }
    }
  }

  $: if (mounted && current !== revealed) {
    revealed = current;
    reveal(currentChunk);
  }

  // After a change, the anchors move with the next flush, so reveal then.
  /** @param {number} chunk */
  async function revealAfterUpdate(chunk) {
    await tick();
    reveal(chunk);
  }

  /** @param {number} chunk */
  function positionOf(chunk) {
    return conflicts.indexOf(chunk);
  }

  /**
   * @param {number} position
   * @returns {string}
   */
  function describe(position) {
    const status = /** @type {MergeResolverStatus} */ (
      summary.statuses[conflicts[position]]
    );
    return `${conflictText(position + 1, total)}: ${statusText(status)}`;
  }

  /** @param {string} message */
  function announce(message) {
    clearTimeout(announceTimer);
    announcement = "";
    announceTimer = setTimeout(() => {
      announcement = message;
    }, 30);
  }

  /**
   * Move to a conflict by its index from 0.
   * @param {number} position
   * @returns {boolean}
   */
  export function goTo(position) {
    if (position < 0 || position >= total) return false;
    current = position;
    revealed = position;
    reveal(conflicts[position]);
    announce(describe(position));
    return true;
  }

  /**
   * Move to the next conflict, wrapping at the end.
   * @param {{ unresolvedOnly?: boolean }} [options]
   * @returns {boolean}
   */
  export function next(options = {}) {
    const chunk = neighborConflict(
      merged,
      currentChunk,
      1,
      options.unresolvedOnly,
    );
    return chunk >= 0 && goTo(positionOf(chunk));
  }

  /**
   * Move to the previous conflict, wrapping at the start.
   * @param {{ unresolvedOnly?: boolean }} [options]
   * @returns {boolean}
   */
  export function previous(options = {}) {
    const chunk = neighborConflict(
      merged,
      currentChunk,
      -1,
      options.unresolvedOnly,
    );
    return chunk >= 0 && goTo(positionOf(chunk));
  }

  // Editing. Every change to the result, typed or accepted, is one entry:
  // the chunk's text before and after. Undo swaps them.
  /**
   * @param {import("../utils/merge-result.js").HistoryEntry} entry
   * @param {boolean} typed
   */
  function record(entry, typed) {
    history = history.slice(0, historyIndex);
    const now = Date.now();
    const last = history[history.length - 1];
    if (typed && last && now - lastEditAt < COALESCE_MS) {
      const joined = coalesceEntries(last, entry);
      if (joined) {
        history[history.length - 1] = joined;
        lastEditAt = now;
        canRedo = false;
        return;
      }
    }
    history.push(entry);
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length;
    lastEditAt = typed ? now : 0;
    canUndo = true;
    canRedo = false;
  }

  /** @param {import("../utils/merge-result.js").TextPatch} patch */
  function patchTextarea(patch) {
    if (!resultEl) return;
    resultEl.setRangeText(patch.text, patch.start, patch.end, "preserve");
    lastValue = resultEl.value;
  }

  function changed() {
    rev++;
    resolved = false;
  }

  /**
   * Accept a choice for a conflict.
   * @param {MergeResolverChoice} choice
   * @param {number} [position] Defaults to the current conflict.
   * @returns {boolean}
   */
  export function accept(choice, position = current) {
    const chunk = conflicts[position];
    if (chunk === undefined) return false;
    const entry = acceptChunk(merged, chunk, choice);
    if (!entry) return false;
    patchTextarea(applyEntry(merged, entry));
    record(entry, false);
    changed();
    const left = conflicts.filter(
      (i) => chunkStatus(merged, i) === "unresolved",
    ).length;
    const status = /** @type {MergeResolverStatus} */ (
      chunkStatus(merged, chunk)
    );
    const message = `${conflictText(position + 1, total)}: ${statusText(status)}. ${remainingText(left)}`;
    current = position;
    const target =
      advanceOnAccept && left > 0
        ? neighborConflict(merged, chunk, 1, true)
        : -1;
    if (target >= 0) {
      const nextPosition = positionOf(target);
      current = nextPosition;
      revealed = nextPosition;
      revealAfterUpdate(target);
      announce(`${message} ${describe(nextPosition)}.`);
    } else {
      announce(message);
    }
    return true;
  }

  /**
   * Undo the last change to the result.
   * @returns {boolean}
   */
  export function undo() {
    if (historyIndex === 0) return false;
    historyIndex--;
    const entry = history[historyIndex];
    patchTextarea(applyEntry(merged, invertEntry(entry)));
    afterHistory(entry, undoneText);
    return true;
  }

  /**
   * Redo the last undone change.
   * @returns {boolean}
   */
  export function redo() {
    if (historyIndex >= history.length) return false;
    const entry = history[historyIndex];
    historyIndex++;
    patchTextarea(applyEntry(merged, entry));
    afterHistory(entry, redoneText);
    return true;
  }

  /**
   * @param {import("../utils/merge-result.js").HistoryEntry} entry
   * @param {string} message
   */
  function afterHistory(entry, message) {
    canUndo = historyIndex > 0;
    canRedo = historyIndex < history.length;
    lastEditAt = 0;
    changed();
    const position = positionOf(entry.chunk);
    if (position >= 0) {
      current = position;
      revealed = position;
      revealAfterUpdate(entry.chunk);
    }
    const left = conflictIndexes(merged).filter(
      (i) => chunkStatus(merged, i) === "unresolved",
    ).length;
    announce(`${message}. ${remainingText(left)}`);
  }

  /**
   * Mark the merge resolved, if no conflict still has its markers. Fires
   * `resolve`; `preventDefault()` there keeps it unresolved.
   * @returns {boolean}
   */
  export function resolve() {
    if (remaining > 0) return false;
    const proceed = dispatch(
      "resolve",
      { text: result, remaining: 0, conflicts: total },
      { cancelable: true },
    );
    if (!proceed) return false;
    resolved = true;
    announce(resolvedText);
    return true;
  }

  function handleBeforeInput(/** @type {InputEvent} */ event) {
    if (event.inputType === "historyUndo") {
      event.preventDefault();
      undo();
    } else if (event.inputType === "historyRedo") {
      event.preventDefault();
      redo();
    } else if (resultEl) {
      selectionBefore = resultEl.selectionStart;
    }
  }

  function handleInput() {
    if (!resultEl) return;
    const value = resultEl.value;
    if (value === lastValue) return;
    const { start, end, insert } = diffRange(
      lastValue,
      value,
      selectionBefore ?? resultEl.selectionStart,
    );
    selectionBefore = null;
    const entry = editText(merged, start, end, insert);
    const before = chunkStatus(merged, entry.chunk);
    applyEntry(merged, entry);
    lastValue = value;
    record(entry, true);
    changed();
    const after = chunkStatus(merged, entry.chunk);
    const position = positionOf(entry.chunk);
    if (position >= 0 && before === "unresolved" && after !== "unresolved") {
      const left = conflictIndexes(merged).filter(
        (i) => chunkStatus(merged, i) === "unresolved",
      ).length;
      announce(
        `${conflictText(position + 1, total)}: ${statusText("edited")}. ${remainingText(left)}`,
      );
    }
  }

  function followCaret() {
    if (!resultEl) return;
    const chunk = chunkAt(summary.offsets, resultEl.selectionStart);
    const position = positionOf(chunk);
    if (position >= 0 && position !== current) {
      current = position;
      revealed = position;
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || isImeComposition(event)) return;
    /** @type {Array<[keyof MergeResolverShortcuts, () => unknown]>} */
    const table = [
      ["next", () => next()],
      ["previous", () => previous()],
      ["ours", () => accept("ours")],
      ["theirs", () => accept("theirs")],
      ["both", () => accept("both")],
      ["bothReversed", () => accept("both-reversed")],
      ["base", () => accept("base")],
      ["undo", () => undo()],
      ["redo", () => redo()],
      ["resolve", () => resolve()],
    ];
    for (const [name, run] of table) {
      if (matchesShortcut(event, keys[name])) {
        event.preventDefault();
        run();
        return;
      }
    }
  }

  /** @param {CustomEvent<{ chunk: number, side: "ours" | "theirs" }>} event */
  function handleHeadAccept(event) {
    const position = positionOf(event.detail.chunk);
    if (position >= 0) accept(event.detail.side, position);
  }

  /** @param {string | string[]} shortcut */
  function first(shortcut) {
    return typeof shortcut === "string" ? shortcut : shortcut[0];
  }

  /** @param {string | string[]} shortcut */
  function keyShortcuts(shortcut) {
    return ariaKeyShortcuts(shortcut, { apple: $applePlatform }) || undefined;
  }

  function measure() {
    if (probeEl) {
      const measured = probeEl.getBoundingClientRect().height;
      if (measured > 0) rowHeight = measured;
    }
  }

  onMount(() => {
    mounted = true;
    notified = summary;
    revealed = current;
    /** @type {Array<() => void>} */
    const stops = [];
    if (ref) {
      stops.push(
        observeResize(ref, (entry) => {
          rootWidth = Math.round(entry.contentRect.width);
        }),
      );
    }
    if (probeEl) stops.push(observeResize(probeEl, measure));
    return () => {
      for (const stop of stops) stop();
      clearTimeout(announceTimer);
      clearTimeout(highlightTimer);
    };
  });

  const PANE_NAMES = /** @type {const} */ (["ours", "result", "theirs"]);
</script>

<div
  bind:this={ref}
  class:bx--merge-resolver={true}
  class:bx--merge-resolver--columns={mode === "columns"}
  class:bx--merge-resolver--stacked={mode === "stacked"}
  class:bx--merge-resolver--tabs={mode === "tabs"}
  style:--ccs-merge-height={height}
  style:--ccs-merge-gutter="{digits + 3}ch"
  role="group"
  aria-label={labelText}
  {...$$restProps}
  on:keydown={handleKeydown}
>
  <div
    class:bx--merge-resolver__toolbar={true}
    role="group"
    aria-label={actionsLabel}
  >
    <div class:bx--merge-resolver__nav={true}>
      <Button
        kind="ghost"
        size="sm"
        icon={ArrowUp}
        iconDescription={previousText}
        tooltipAlignment="start"
        disabled={total === 0}
        aria-keyshortcuts={keyShortcuts(keys.previous)}
        on:click={() => previous()}
      />
      <Button
        kind="ghost"
        size="sm"
        icon={ArrowDown}
        iconDescription={nextText}
        tooltipAlignment="start"
        disabled={total === 0}
        aria-keyshortcuts={keyShortcuts(keys.next)}
        on:click={() => next()}
      />
      <span class:bx--merge-resolver__status={true}>
        {#if total === 0}
          {noConflictsText}
        {:else}
          {#if current >= 0}<strong>{conflictText(current + 1, total)}</strong
            >{/if}
          <span class:bx--merge-resolver__remaining={true}
            >{remainingText(remaining)}</span
          >
        {/if}
      </span>
    </div>
    <div class:bx--merge-resolver__accept={true}>
      <Button
        kind="tertiary"
        size="sm"
        disabled={currentChunk < 0}
        aria-keyshortcuts={keyShortcuts(keys.ours)}
        on:click={() => accept("ours")}>{acceptOursText}</Button
      >
      <Button
        kind="tertiary"
        size="sm"
        disabled={currentChunk < 0}
        aria-keyshortcuts={keyShortcuts(keys.theirs)}
        on:click={() => accept("theirs")}>{acceptTheirsText}</Button
      >
      <Button
        kind="tertiary"
        size="sm"
        disabled={currentChunk < 0}
        aria-keyshortcuts={keyShortcuts(keys.both)}
        on:click={() => accept("both")}>{acceptBothText}</Button
      >
      <Button
        kind="tertiary"
        size="sm"
        disabled={currentChunk < 0}
        aria-keyshortcuts={keyShortcuts(keys.bothReversed)}
        on:click={() => accept("both-reversed")}
        >{acceptBothReversedText}</Button
      >
      <Button
        kind="tertiary"
        size="sm"
        disabled={currentChunk < 0 || !merged.chunks[currentChunk]?.base}
        aria-keyshortcuts={keyShortcuts(keys.base)}
        on:click={() => accept("base")}>{acceptBaseText}</Button
      >
    </div>
    <div class:bx--merge-resolver__history={true}>
      <Button
        kind="ghost"
        size="sm"
        class="bx--merge-resolver__undo"
        icon={Undo}
        iconDescription={undoText}
        disabled={!canUndo}
        aria-keyshortcuts={keyShortcuts(keys.undo)}
        on:click={() => undo()}
      />
      <Button
        kind="ghost"
        size="sm"
        class="bx--merge-resolver__redo"
        icon={Undo}
        iconDescription={redoText}
        disabled={!canRedo}
        aria-keyshortcuts={keyShortcuts(keys.redo)}
        on:click={() => redo()}
      />
      <Button
        kind="primary"
        size="sm"
        disabled={remaining > 0 || resolved}
        aria-keyshortcuts={keyShortcuts(keys.resolve)}
        on:click={() => resolve()}
        >{resolved ? resolvedText : resolveText}</Button
      >
    </div>
  </div>

  {#if tabbed}
    <div
      class:bx--merge-resolver__switcher={true}
      role="group"
      aria-label={paneSwitcherLabel}
    >
      {#each PANE_NAMES as pane (pane)}
        <Button
          kind={activePane === pane ? "secondary" : "tertiary"}
          size="sm"
          aria-pressed={activePane === pane ? "true" : "false"}
          on:click={() => showPane(pane)}
          >{pane === "ours"
            ? oursLabel
            : pane === "theirs"
              ? theirsLabel
              : resultLabel}</Button
        >
      {/each}
    </div>
  {/if}

  <div class:bx--merge-resolver__panes={true}>
    <MergeResolverSide
      side="ours"
      bind:ref={oursEl}
      title={oursLabel}
      titleId="{rootId}-ours"
      rows={oursSide.rows}
      longest={oursSide.longest}
      chunks={merged.chunks}
      tokenLines={oursTokens}
      statuses={summary.statuses}
      {heads}
      {currentChunk}
      {rowHeight}
      {wordMarks}
      acceptText={acceptOursText}
      emptyText={emptySideText}
      hidden={!visible.ours}
      on:scroll={() => syncFrom("ours")}
      on:accept={handleHeadAccept}
    />
    <MergeResolverResult
      bind:ref={resultEl}
      title={resultLabel}
      titleId="{rootId}-result"
      describedBy="{rootId}-shortcuts"
      seed={seedText}
      lines={resultLines}
      tokenLines={resultTokens}
      lineStarts={summary.lineStarts}
      statuses={summary.statuses}
      {currentChunk}
      {rowHeight}
      hidden={!visible.result}
      on:scroll={() => syncFrom("result")}
      on:beforeinput={(event) => handleBeforeInput(event)}
      on:input={handleInput}
      on:click={followCaret}
      on:keyup={followCaret}
    />
    <MergeResolverSide
      side="theirs"
      bind:ref={theirsEl}
      title={theirsLabel}
      titleId="{rootId}-theirs"
      rows={theirsSide.rows}
      longest={theirsSide.longest}
      chunks={merged.chunks}
      tokenLines={theirsTokens}
      statuses={summary.statuses}
      {heads}
      {currentChunk}
      {rowHeight}
      {wordMarks}
      acceptText={acceptTheirsText}
      emptyText={emptySideText}
      hidden={!visible.theirs}
      on:scroll={() => syncFrom("theirs")}
      on:accept={handleHeadAccept}
    />
  </div>

  <ul
    class:bx--merge-resolver__shortcuts={true}
    id="{rootId}-shortcuts"
    aria-label={shortcutsText}
  >
    <li><Kbd shortcut={first(keys.previous)} size="sm" /> {previousText}</li>
    <li><Kbd shortcut={first(keys.next)} size="sm" /> {nextText}</li>
    <li><Kbd shortcut={first(keys.ours)} size="sm" /> {acceptOursText}</li>
    <li><Kbd shortcut={first(keys.theirs)} size="sm" /> {acceptTheirsText}</li>
    <li><Kbd shortcut={first(keys.both)} size="sm" /> {acceptBothText}</li>
    <li><Kbd shortcut={first(keys.undo)} size="sm" /> {undoText}</li>
    <li><Kbd shortcut={first(keys.resolve)} size="sm" /> {resolveText}</li>
  </ul>

  <span
    bind:this={probeEl}
    class:bx--merge-resolver__probe={true}
    aria-hidden="true">0</span
  >
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
</div>
