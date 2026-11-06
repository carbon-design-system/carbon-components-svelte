<script>
  /**
   * @typedef {import("../Theme/Theme.svelte").CarbonTheme | "system"} WebTerminalTheme
   * @typedef {{ signal: AbortSignal; write: (text: string) => void; clear: () => void }} WebTerminalContext
   * @typedef {void | null | undefined | string | Iterable<string | Uint8Array> | AsyncIterable<string | Uint8Array>} WebTerminalOutput
   * @typedef {"ok" | "error" | "cancelled"} WebTerminalStatus
   */

  /**
   * @restProps {div}
   * @event {{ command: string }} command - Fires when a command is run, before `execute` is called.
   * @event {{ command: string; status: WebTerminalStatus; lines: number }} finish - Fires when a command ends, by finishing, failing or being cancelled.
   * @event {{ command: string }} cancel - Fires when Control + C cancels a running command.
   * @event {null} clear - Fires when the scrollback is cleared.
   * @event {{ length: number }} copy - Fires when the output is copied.
   * @event {{ error: unknown }} copy:error
   */

  /**
   * Specify the function that runs a command. It receives the command and a
   * context with an `AbortSignal` that fires when the user cancels, a `write`
   * function, and `clear`. It may return nothing, a string, or a stream: an
   * array, a generator or an async generator of strings or bytes, written
   * as they arrive. Throwing, or rejecting, prints the message as an error.
   * Without it, `command` is the only signal and the app calls `write`.
   * @type {((command: string, context: WebTerminalContext) => WebTerminalOutput | Promise<WebTerminalOutput>) | undefined}
   */
  export let execute = undefined;

  /**
   * Specify the function that completes the word at the cursor when Tab is
   * pressed. It receives the line and the cursor position and returns the
   * candidates, or an object with `candidates` and the `from` and `to` of the
   * text they replace. It may be async. Without it, Tab moves focus.
   * @type {((line: string, cursor: number) => string[] | { candidates: string[]; from?: number; to?: number } | Promise<string[] | { candidates: string[]; from?: number; to?: number }>) | undefined}
   */
  export let complete = undefined;

  /** Specify the prompt shown before the command line. */
  export let prompt = "$";

  /**
   * Specify the commands that were run, oldest first. Arrow Up and Down walk
   * them. Each command run is added, except an empty one or a repeat of the
   * last. Keep it in storage to keep history across visits.
   * @type {string[]}
   * @bindable writable
   */
  export let history = [];

  /** Specify the most commands to keep in `history`. */
  export let maxHistory = 500;

  /** Specify the text in the command line. */
  export let value = "";

  /**
   * Specify the most rows to keep. When more arrive, the oldest are dropped.
   */
  export let maxLines = 100000;

  /**
   * Specify the most characters in one row. Text past it is dropped and the
   * row ends in an ellipsis. Read once, when the terminal is created.
   */
  export let maxLineLength = 16384;

  /**
   * Set to `true` to wrap long rows. Otherwise a row stays on one line and
   * the output scrolls sideways.
   */
  export let wrap = false;

  /**
   * Set to `true` to keep the newest row in view as output arrives. Scrolling
   * up sets it to `false`; scrolling back to the end, running a command, or
   * "Jump to latest" sets it back.
   * @bindable writable
   */
  export let follow = true;

  /**
   * `true` while a command is running.
   * @bindable readonly
   */
  export let running = false;

  /** Specify the title in the header, which names the terminal. */
  export let title = "Terminal";

  /** Set to `true` to hide the header and its buttons. */
  export let hideHeader = false;

  /** Set to `true` to show a button that toggles `maximized`. */
  export let maximizable = false;

  /**
   * Set to `true` when the terminal is maximized. The terminal only reports
   * it: the host decides what it means, such as collapsing the other pane of
   * a `Splitter`.
   * @bindable writable
   */
  export let maximized = false;

  /**
   * Specify the theme of the terminal. A terminal is dark whatever the page
   * is, so it defaults to Gray 100. `"system"` follows the operating system.
   * @type {WebTerminalTheme}
   */
  export let theme = "g100";

  /**
   * Specify the height as a CSS length. Use `"100%"` to fill a parent that
   * has a height, such as a pane of a `Splitter`.
   */
  export let height = "24rem";

  /**
   * Specify the lowest contrast ratio for 256-color and truecolor text. Those
   * colors are moved toward black or white until they read. Set `0` to draw
   * them as written.
   */
  export let minContrast = 4.5;

  /**
   * Specify how many lines a command may print for them to be read out in
   * full when it ends. Longer output is announced as a count. Set `0` to
   * always announce a count.
   */
  export let announceLines = 5;

  /**
   * Specify the accessible name of the output, such as "Cluster shell output".
   */
  export let labelText = "Terminal output";

  /** Specify the accessible name of the command line. */
  export let inputLabelText = "Command";

  /**
   * Specify the keys description read with the command line. The default
   * names the keys; it adds Tab and Escape when `complete` is set.
   * @type {string | undefined}
   */
  export let hintText = undefined;

  /** Specify the label of the button that copies the output. */
  export let copyOutputText = "Copy output";

  /** Specify the label of the button that clears the output. */
  export let clearText = "Clear output";

  /** Specify the label of the button that maximizes the terminal. */
  export let maximizeText = "Maximize";

  /** Specify the label of the button that restores a maximized terminal. */
  export let restoreText = "Restore";

  /** Specify the label of the button on a command that copies it. */
  export let copyCommandText = "Copy command";

  /** Specify the text announced and shown when text is copied. */
  export let copiedText = "Copied";

  /** Specify the text shown when copying fails. */
  export let copyErrorText = "Failed to copy";

  /** Specify the text announced when completion finds nothing. */
  export let noCompletionsText = "No completions";

  /**
   * Specify the label of the button that returns to the newest row.
   * @type {(newRows: number) => string}
   */
  export let jumpText = defaultJumpText;

  /**
   * Specify what is announced when a command ends and its output is too long
   * to read out.
   * @type {(result: { status: WebTerminalStatus; lines: number }) => string}
   */
  export let finishedText = defaultFinishedText;

  /**
   * Specify what is announced when completion lists candidates.
   * @type {(count: number) => string}
   */
  export let completionsText = defaultCompletionsText;

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Obtain a reference to the command line.
   * @type {null | HTMLInputElement}
   * @bindable readonly
   */
  export let inputRef = null;

  /**
   * Set an id for the root element. The command line and the output derive
   * theirs from it as `{id}-input` and `{id}-output`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import ThemeZone from "../ThemeZone/ThemeZone.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import Maximize from "../icons/Maximize.svelte";
  import Minimize from "../icons/Minimize.svelte";
  import TrashCan from "../icons/TrashCan.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { relativeLuminance } from "../utils/color-contrast.js";
  import { copyText } from "../utils/copy-text.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { applyCompletion } from "../utils/terminal-complete.js";
  import { ABORTED, pipeOutput, raceAbort } from "../utils/terminal-run.js";
  import { createTerminalBuffer } from "../utils/terminal-text.js";
  import { uniqueId } from "../utils/unique-id.js";
  import WebTerminalLine from "./WebTerminalLine.svelte";

  const CSS_NUMBER = /[\d.]+/g;
  /** How near the end, in pixels, still counts as at the end. */
  const NEAR_END = 24;
  /** Rows rendered past each edge. Covers the rows of a fast stream. */
  const OVERSCAN = 40;
  /** The most rows rendered past an edge for a burst of rows. */
  const MAX_OVERSCAN = 120;
  /** The longest text read out when a command ends. */
  const MAX_ANNOUNCED_CHARACTERS = 400;
  /** The most completions listed in the output. */
  const MAX_LISTED = 200;

  const LIGHT_THEMES = new Set(["white", "g10"]);
  /** Below this luminance the zone's background is dark. */
  const DARK_LUMINANCE = 0.18;

  /**
   * @param {number} newRows
   * @returns {string}
   */
  function defaultJumpText(newRows) {
    return newRows > 0 ? `Jump to latest (${newRows} new)` : "Jump to latest";
  }

  /**
   * @param {{ status: WebTerminalStatus; lines: number }} result
   * @returns {string}
   */
  function defaultFinishedText({ status, lines }) {
    const count = `${lines} ${lines === 1 ? "line" : "lines"}`;
    if (status === "cancelled") return "Command cancelled";
    if (status === "error") return `Command failed, ${count}`;
    return `Command finished, ${count}`;
  }

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultCompletionsText(count) {
    return `${count} completions`;
  }

  const dispatch = createEventDispatcher();

  const buffer = createTerminalBuffer({ maxLines, maxLineLength });
  $: buffer.maxLines = maxLines;

  const announceStatus = createStatusAnnouncer((text) => {
    announcement = text;
  });

  const inputId = `${id}-input`;
  const outputId = `${id}-output`;
  const titleId = `${id}-title`;
  const hintId = `${id}-hint`;

  let announcement = "";
  /** @type {import("../utils/terminal-text.js").TerminalRow[]} */
  let view = [];
  let containerHeight = 320;
  let overscan = OVERSCAN;
  let rowHeight = 20;
  /** @type {number | null} */
  let backgroundLuminance = null;
  /** @type {null | HTMLDivElement} */
  let bodyRef = null;
  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  let mounted = false;
  /** Rows added since the reader scrolled away from the end. */
  let unseen = 0;
  /** Where the terminal last scrolled itself to. */
  let programmaticTop = -1;
  let lastTop = 0;
  let shownFirstId = -1;
  let selectedAll = false;
  /** @type {number} */
  let frame = 0;
  let flushQueued = false;
  let pendingAdded = 0;

  let historyIndex = history.length;
  let draft = "";
  /** Set by Escape so the next Tab moves focus out of the command line. */
  let tabReleased = false;
  let completionToken = 0;
  /** @type {string | null} */
  let copiedCommand = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let copiedTimer;

  /** @type {{ token: number; controller: AbortController; command: string; startId: number } | null} */
  let current = null;
  let runToken = 0;

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));
  $: light =
    theme === "system"
      ? backgroundLuminance !== null && backgroundLuminance >= DARK_LUMINANCE
      : LIGHT_THEMES.has(theme);
  $: hint =
    hintText ??
    `Press Enter to run. Up and Down arrows browse history. Control C cancels, Control L clears.${
      complete
        ? " Tab completes. Press Escape, then Tab, to leave the field."
        : ""
    }`;
  $: rootStyle = [`height: ${height}`, rootProps.style]
    .filter(Boolean)
    .join("; ");
  $: rootClass = [
    rootProps.class,
    "bx--web-terminal",
    light && "bx--web-terminal--light",
    wrap && "bx--web-terminal--wrap",
    selectedAll && "bx--web-terminal--selected",
    running && "bx--web-terminal--running",
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Take in what changed in the buffer: the view, and where the reader is.
   * @param {number} added Rows that arrived.
   */
  function settle(added) {
    buffer.trim();
    // The window is drawn for where the reader is, and then the output
    // scrolls to the rows that arrived. Rows past the edge keep that from
    // showing blank space, so a burst of more rows than OVERSCAN draws that
    // many.
    overscan = mounted
      ? Math.min(MAX_OVERSCAN, Math.max(OVERSCAN, added + OVERSCAN / 4))
      : OVERSCAN;
    const previousFirst = shownFirstId;
    const previousLength = view.length;
    view = buffer.view();
    const first = view.length > 0 ? view[0].id : buffer.nextId();
    shownFirstId = first;

    if (follow) {
      pin();
      return;
    }
    if (added > 0 && mounted) unseen += added;
    // Rows dropped from the front move everything up. Put the reader back on
    // the rows they were reading. A wrapped row has no known height, so the
    // output keeps its rows instead.
    const dropped = first - previousFirst;
    if (
      previousFirst >= 0 &&
      dropped > 0 &&
      previousLength > 0 &&
      !wrap &&
      scrollerRef
    ) {
      scrollerRef.scrollTop = Math.max(
        0,
        scrollerRef.scrollTop - dropped * rowHeight,
      );
      programmaticTop = scrollerRef.scrollTop;
    }
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

  function flushNow() {
    if (!flushQueued) return;
    cancelAnimationFrame(frame);
    flush();
  }

  /**
   * Add output. It is read now and drawn on the next frame, so any number of
   * calls in one frame cost one update. Escape sequences are read as in
   * the stream of a terminal; see the supported subset in the docs.
   *
   * @type {(text: string) => void}
   */
  export function write(text) {
    const before = buffer.nextId();
    buffer.write(String(text));
    pendingAdded += buffer.nextId() - before;
    queueFlush();
  }

  /**
   * Add output followed by a newline.
   * @type {(text?: string) => void}
   */
  export function writeln(text = "") {
    write(`${text}\n`);
  }

  /**
   * Remove every row from the output.
   * @returns {void}
   */
  export function clear() {
    buffer.clear();
    pendingAdded = 0;
    unseen = 0;
    selectedAll = false;
    shownFirstId = -1;
    view = [];
    dispatch("clear");
  }

  /**
   * Move focus to the command line.
   * @returns {void}
   */
  export function focus() {
    inputRef?.focus({ preventScroll: true });
  }

  /**
   * Scroll to the newest row and follow the output from there.
   * @returns {void}
   */
  export function scrollToEnd() {
    follow = true;
    unseen = 0;
    pin();
  }

  /**
   * The output as plain text, one row per line.
   * @returns {string}
   */
  export function getText() {
    return buffer.getText();
  }

  /**
   * Copy the output as plain text.
   * @returns {Promise<void>}
   */
  export async function copy() {
    const text = buffer.getText();
    await copyText(text);
    dispatch("copy", { length: text.length });
  }

  /**
   * Run a command as if it had been typed, and wait for it to end.
   * @type {(command: string) => Promise<void>}
   */
  export async function run(command) {
    await runCommand(String(command));
  }

  /**
   * Cancel the running command, as Control + C does.
   * @returns {void}
   */
  export function cancel() {
    if (!current) return;
    const { controller, command } = current;
    controller.abort();
    write("^C\n");
    dispatch("cancel", { command });
    endRun("cancelled");
  }

  /**
   * @param {import("../utils/terminal-text.js").TerminalRow} row
   * @returns {number}
   */
  function rowKey(row) {
    return row.id;
  }

  /** Keep the output at its end, once what was added has been drawn. */
  async function pin() {
    await tick();
    if (!scrollerRef || !follow) return;
    const end = scrollerRef.scrollHeight - scrollerRef.clientHeight;
    if (Math.abs(scrollerRef.scrollTop - end) < 0.5) return;
    scrollerRef.scrollTop = end;
    programmaticTop = scrollerRef.scrollTop;
  }

  let prevFollow = follow;
  $: if (follow !== prevFollow) {
    prevFollow = follow;
    if (follow) {
      unseen = 0;
      pin();
    }
  }

  function handleScroll() {
    if (!scrollerRef) return;
    const top = scrollerRef.scrollTop;
    const gap = scrollerRef.scrollHeight - top - scrollerRef.clientHeight;
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
    if (event.deltaY < 0 && follow) follow = false;
  }

  /** @param {KeyboardEvent} event */
  function handleOutputKeydown(event) {
    if (event.target !== scrollerRef) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selectedAll = view.length > 0;
    } else if (modifier && event.key.toLowerCase() === "c" && selectedAll) {
      event.preventDefault();
      copyAll();
    } else if (event.key === "Escape" && selectedAll) {
      selectedAll = false;
    } else if (
      (event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "Home") &&
      follow
    ) {
      follow = false;
    } else if (
      event.key.length === 1 &&
      !modifier &&
      !event.altKey &&
      event.key !== " "
    ) {
      // Typing goes to the command line, as in a terminal.
      focus();
    }
  }

  async function copyAll() {
    try {
      await copy();
      announceStatus(copiedText);
    } catch (error) {
      dispatch("copy:error", { error });
      announceStatus(copyErrorText);
    }
  }

  /** @param {CustomEvent<{ command: string }>} event */
  async function copyCommand(event) {
    const { command } = event.detail;
    try {
      await copyText(command);
      dispatch("copy", { length: command.length });
      announceStatus(copiedText);
      copiedCommand = command;
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        copiedCommand = null;
      }, 1500);
    } catch (error) {
      dispatch("copy:error", { error });
      announceStatus(copyErrorText);
    }
  }

  /** @param {number} deltaPages */
  function scrollPages(deltaPages) {
    if (!scrollerRef) return;
    if (deltaPages < 0 && follow) follow = false;
    scrollerRef.scrollTop += deltaPages * scrollerRef.clientHeight * 0.9;
  }

  /**
   * @param {string} command
   */
  function pushHistory(command) {
    if (command.trim() === "" || history[history.length - 1] === command) {
      return;
    }
    history = [...history, command].slice(-Math.max(1, maxHistory));
  }

  /** @param {string} text */
  async function setValue(text) {
    value = text;
    await tick();
    inputRef?.setSelectionRange(text.length, text.length);
  }

  /**
   * @param {string} command
   */
  async function runCommand(command) {
    buffer.echo(`${prompt} `, command);
    pushHistory(command);
    historyIndex = history.length;
    draft = "";
    selectedAll = false;
    follow = true;
    pendingAdded += 1;
    queueFlush();
    flushNow();
    dispatch("command", { command });
    if (!execute) return;

    const token = ++runToken;
    const controller = new AbortController();
    const { signal } = controller;
    current = { token, controller, command, startId: buffer.nextId() };
    running = true;

    /** @type {WebTerminalStatus} */
    let status = "ok";
    try {
      const context = {
        signal,
        write: (/** @type {string} */ text) => {
          if (token === runToken && !signal.aborted) write(text);
        },
        clear,
      };
      const result = await raceAbort(
        Promise.resolve().then(() => execute?.(command, context)),
        signal,
      );
      if (result !== ABORTED) {
        await pipeOutput(result, {
          signal,
          write: (text) => {
            if (token === runToken && !signal.aborted) write(text);
          },
        });
      }
    } catch (error) {
      if (!signal.aborted) {
        status = "error";
        const message =
          error instanceof Error ? error.message || error.name : String(error);
        write(`\u001b[31m${message}\u001b[0m\n`);
      }
    }
    if (token === runToken && current?.token === token && !signal.aborted) {
      // End the row a stream left open, so the next prompt starts clean.
      if (buffer.hasOpenRow()) write("\n");
      endRun(status);
    }
  }

  /**
   * @param {WebTerminalStatus} status
   */
  function endRun(status) {
    const finished = current;
    if (!finished) return;
    // The output is drawn before the command is reported finished.
    flushNow();
    current = null;
    running = false;
    const rows = buffer.since(finished.startId);
    const lines = rows.length;
    dispatch("finish", { command: finished.command, status, lines });

    let message;
    if (status !== "cancelled" && lines > 0 && lines <= announceLines) {
      message = rows
        .map((row) => row.text)
        .join(". ")
        .slice(0, MAX_ANNOUNCED_CHARACTERS);
    }
    announceStatus(message || finishedText({ status, lines }));
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event)) return;
    const key = event.key;
    const control = event.ctrlKey && !event.metaKey && !event.altKey;

    if (key !== "Tab" && key !== "Shift") tabReleased = false;

    if (key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    } else if (control && key.toLowerCase() === "c") {
      // With text selected, Control + C copies it, as everywhere else.
      if (hasSelection()) return;
      event.preventDefault();
      interrupt();
    } else if (control && key.toLowerCase() === "l") {
      event.preventDefault();
      clear();
    } else if (control && key === "Home") {
      event.preventDefault();
      if (scrollerRef) {
        follow = false;
        scrollerRef.scrollTop = 0;
      }
    } else if (control && key === "End") {
      event.preventDefault();
      scrollToEnd();
    } else if (key === "PageUp" || key === "PageDown") {
      event.preventDefault();
      scrollPages(key === "PageUp" ? -1 : 1);
    } else if (
      (key === "ArrowUp" || key === "ArrowDown") &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      browseHistory(key === "ArrowUp" ? -1 : 1);
    } else if (
      key === "Tab" &&
      complete &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      if (tabReleased) {
        tabReleased = false;
        return;
      }
      event.preventDefault();
      if (!running) completeInput();
    } else if (key === "Escape") {
      tabReleased = true;
      selectedAll = false;
    }
  }

  function hasSelection() {
    if (inputRef && inputRef.selectionStart !== inputRef.selectionEnd) {
      return true;
    }
    return (globalThis.getSelection?.()?.toString() ?? "") !== "";
  }

  function submit() {
    if (running) return;
    const command = value;
    if (command.trim() === "") return;
    value = "";
    runCommand(command);
  }

  /** Control + C: cancel a running command, or give up the line being typed. */
  function interrupt() {
    if (running) {
      cancel();
      return;
    }
    buffer.echo(`${prompt} `, `${value}^C`);
    pendingAdded += 1;
    queueFlush();
    follow = true;
    historyIndex = history.length;
    draft = "";
    value = "";
  }

  /** @param {-1 | 1} step */
  function browseHistory(step) {
    if (running || history.length === 0) return;
    const next = historyIndex + step;
    if (next < 0 || next > history.length) return;
    if (historyIndex === history.length) draft = value;
    historyIndex = next;
    setValue(next === history.length ? draft : history[next]);
  }

  async function completeInput() {
    if (!complete || !inputRef) return;
    const line = inputRef.value;
    const cursor = inputRef.selectionStart ?? line.length;
    const token = ++completionToken;
    let result;
    try {
      result = await complete(line, cursor);
    } catch {
      return;
    }
    // The line changed while the function ran, so its answer is for another.
    if (token !== completionToken || !inputRef || inputRef.value !== line) {
      return;
    }
    const applied = applyCompletion(line, cursor, result);
    if (applied.list.length > 0) {
      const shown = applied.list.slice(0, MAX_LISTED);
      buffer.echo(`${prompt} `, line);
      write(
        `${shown.join("  ")}${applied.list.length > shown.length ? "  …" : ""}\n`,
      );
      follow = true;
      announceStatus(completionsText(applied.list.length));
    } else if (applied.value === line) {
      announceStatus(noCompletionsText);
    }
    if (applied.value !== line) {
      value = applied.value;
      await tick();
      inputRef?.setSelectionRange(applied.cursor, applied.cursor);
    }
  }

  function readBackground() {
    if (!scrollerRef) return;
    const channels =
      getComputedStyle(scrollerRef).backgroundColor.match(CSS_NUMBER);
    if (!channels || channels.length < 3) return;
    const [r, g, b] = channels.slice(0, 3).map((part) => Number(part) / 255);
    backgroundLuminance = relativeLuminance([r, g, b]);
  }

  function readRowHeight() {
    if (!scrollerRef) return;
    const lineHeight = Number.parseFloat(
      getComputedStyle(scrollerRef).lineHeight,
    );
    if (lineHeight > 0) rowHeight = lineHeight;
  }

  // The zone's background follows `theme`, and `"system"` follows the
  // operating system, so the luminance is read again when either changes.
  $: if (mounted && theme) tick().then(readBackground);

  onMount(() => {
    mounted = true;
    readRowHeight();
    readBackground();
    const scheme = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    scheme?.addEventListener?.("change", readBackground);
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
    const scroller = scrollerRef;
    if (scroller) {
      scroller.addEventListener("scroll", handleScroll, { passive: true });
      scroller.addEventListener("wheel", handleWheel, { passive: true });
      scroller.addEventListener("keydown", handleOutputKeydown);
      lastTop = scroller.scrollTop;
      const spacer = /** @type {HTMLElement | null} */ (
        scroller.firstElementChild
      );
      if (spacer) {
        // Wrapped rows settle to their real height after they are drawn,
        // which grows the output under a reader who is following it.
        stops.push(
          observeResize(spacer, () => {
            if (follow) pin();
          }),
        );
      }
    }
    if (follow) pin();
    return () => {
      mounted = false;
      scheme?.removeEventListener?.("change", readBackground);
      for (const stop of stops) stop();
      scroller?.removeEventListener("scroll", handleScroll);
      scroller?.removeEventListener("wheel", handleWheel);
      scroller?.removeEventListener("keydown", handleOutputKeydown);
      cancelAnimationFrame(frame);
      clearTimeout(copiedTimer);
      current?.controller.abort();
    };
  });
</script>

<ThemeZone
  {theme}
  bind:ref
  {id}
  {...rootProps}
  class={rootClass}
  style={rootStyle}
  role="group"
  aria-labelledby={hideHeader ? undefined : titleId}
  aria-label={hideHeader ? title : undefined}
>
  {#if !hideHeader}
    <div class:bx--web-terminal__header={true}>
      <span id={titleId} class:bx--web-terminal__title={true}>{title}</span>
      <div class:bx--web-terminal__actions={true}>
        <CopyButton
          kind="ghost"
          size="sm"
          iconDescription={copyOutputText}
          feedback={copiedText}
          errorFeedback={copyErrorText}
          copy={() => copy()}
          on:copy:error={(event) => dispatch("copy:error", event.detail)}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={TrashCan}
          iconDescription={clearText}
          on:click={clear}
        />
        {#if maximizable}
          <Button
            kind="ghost"
            size="sm"
            icon={maximized ? Minimize : Maximize}
            iconDescription={maximized ? restoreText : maximizeText}
            on:click={() => (maximized = !maximized)}
          />
        {/if}
      </div>
    </div>
  {/if}
  <div bind:this={bodyRef} class:bx--web-terminal__body={true}>
    <VirtualList
      bind:ref={scrollerRef}
      items={view}
      itemHeight={rowHeight}
      {containerHeight}
      {overscan}
      measured={wrap}
      getKey={rowKey}
      id={outputId}
      class="bx--web-terminal__output"
      role="log"
      aria-label={ariaLabel ?? (labelText || undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-live="off"
      aria-busy={running ? "true" : undefined}
      tabindex={0}
      let:item
    >
      <WebTerminalLine
        row={item}
        {backgroundLuminance}
        {minContrast}
        {copyCommandText}
        copied={copiedCommand !== null && copiedCommand === item.command}
        on:copycommand={copyCommand}
      />
    </VirtualList>
    {#if !follow && view.length > 0}
      <div class:bx--web-terminal__jump={true}>
        <Button
          kind="secondary"
          size="sm"
          icon={ArrowDown}
          on:click={scrollToEnd}>{jumpText(unseen)}</Button
        >
      </div>
    {/if}
  </div>
  <div class:bx--web-terminal__input-row={true}>
    <span class:bx--web-terminal__ps={true} aria-hidden="true">{prompt}</span>
    <input
      bind:this={inputRef}
      bind:value
      id={inputId}
      type="text"
      class:bx--web-terminal__input={true}
      dir="ltr"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="send"
      readonly={running}
      aria-label={inputLabelText}
      aria-describedby={hintId}
      on:keydown={handleKeydown}
    />
  </div>
  <span id={hintId} class:bx--visually-hidden={true}>{hint}</span>
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
</ThemeZone>
