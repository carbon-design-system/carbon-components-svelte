<script>
  /**
   * Internal. One row of a `WebTerminal`.
   * @event {{ command: string }} copycommand
   */

  /**
   * The row.
   * @type {import("../utils/terminal-text.js").TerminalRow}
   */
  export let row;

  /**
   * The luminance of the page behind the row, for keeping 256-color and
   * truecolor text readable. `null` leaves those colors as written.
   * @type {number | null}
   */
  export let backgroundLuminance = null;

  /** Specify the lowest contrast ratio those colors may have. */
  export let minContrast = 4.5;

  /** Specify the label of the button that copies a command. */
  export let copyCommandText = "Copy command";

  /** Set to `true` while the command of this row shows as copied. */
  export let copied = false;

  import { createEventDispatcher } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import Copy from "../icons/Copy.svelte";
  import {
    ensureContrast,
    parseHex,
    relativeLuminance,
  } from "../utils/color-contrast.js";

  /** Palette positions for black and white, which read on the page, not a color. */
  const NEUTRAL = new Set(
    /** @type {import("../utils/terminal-text.js").AnsiColor[]} */ ([
      0, 7, 8, 15,
    ]),
  );
  const DARK_TEXT = "#161616";
  const LIGHT_TEXT = "#ffffff";

  const dispatch = createEventDispatcher();

  /**
   * A palette position is themed by the stylesheet. Anything else is a CSS
   * color, or the page's own.
   * @param {import("../utils/terminal-text.js").AnsiColor | undefined} color
   * @param {"text" | "background"} role What the color is for.
   * @param {number | null} luminance
   * @param {number} ratio
   * @returns {string | undefined}
   */
  function resolveColor(color, role, luminance, ratio) {
    if (color === undefined) return undefined;
    if (typeof color === "number") return `var(--ccs-term-ansi-${color})`;
    if (color === "text") return "var(--cds-text-primary)";
    if (color === "background") return "var(--cds-background)";
    return role === "text" && luminance !== null && ratio > 0
      ? ensureContrast(color, luminance, ratio)
      : color;
  }

  /**
   * Text on a background of its own takes a color that reads on it. The
   * palette's black and white are chosen to read on the page, not on a color,
   * so they give way too: white text on red is a common pair.
   * @param {import("../utils/terminal-text.js").AnsiStyle} style
   * @returns {string | undefined}
   */
  function pairedColor(style) {
    const { bg, fg } = style;
    if (bg === undefined || (fg !== undefined && !NEUTRAL.has(fg))) {
      return undefined;
    }
    if (typeof bg === "number") return `var(--ccs-term-ansi-on-${bg})`;
    const rgb = parseHex(bg);
    if (!rgb) return undefined;
    return relativeLuminance(rgb) > 0.18 ? DARK_TEXT : LIGHT_TEXT;
  }

  /**
   * @param {import("../utils/terminal-text.js").AnsiStyle} style
   * @param {number | null} luminance
   * @param {number} ratio
   * @returns {string | undefined}
   */
  function foreground(style, luminance, ratio) {
    return (
      pairedColor(style) ?? resolveColor(style.fg, "text", luminance, ratio)
    );
  }

  /**
   * @param {import("../utils/terminal-text.js").AnsiStyle} style
   * @returns {string | undefined}
   */
  function decoration(style) {
    if (!style.underline && !style.strike) return undefined;
    return [style.underline && "underline", style.strike && "line-through"]
      .filter(Boolean)
      .join(" ");
  }

  function copyCommand() {
    dispatch("copycommand", { command: row.command ?? "" });
  }
</script>

<div class:bx--web-terminal__line={true} data-line-id={row.id}>
  {#if row.kind === "command"}
    <span class:bx--web-terminal__prompt={true}>{row.prompt}</span><span
      class:bx--web-terminal__command={true}>{row.command}</span
    >
    <!-- A pointer shortcut. Keyboard and screen reader users copy from the
         input, which history fills, or with the Copy output button. -->
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      title={copyCommandText}
      class:bx--web-terminal__copy-command={true}
      on:click={copyCommand}
    >
      {#if copied}
        <Checkmark size={16} />
      {:else}
        <Copy size={16} />
      {/if}
    </button>
  {:else if row.runs}
    {#each row.runs as run, index (index)}<span
        style:color={foreground(run.style, backgroundLuminance, minContrast)}
        style:background-color={resolveColor(
          run.style.bg,
          "background",
          null,
          0,
        )}
        style:font-weight={run.style.bold ? "600" : undefined}
        style:font-style={run.style.italic ? "italic" : undefined}
        style:opacity={run.style.dim ? "0.7" : undefined}
        style:text-decoration={decoration(run.style)}>{run.text}</span
      >{/each}
  {:else}{row.text}{/if}
</div>
