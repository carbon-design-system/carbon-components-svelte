<script>
  /**
   * Internal. One line of a `LogViewer`.
   * @event {{ id: number; extend: boolean }} select
   */

  /**
   * The line.
   * @type {import("../utils/log-lines.js").LogRow}
   */
  export let row;

  /**
   * The compiled search, or `null` when there is none.
   * @type {import("../utils/log-search.js").LogMatcher | null}
   */
  export let matcher = null;

  /** Which match of this line is the current one, or `-1` when none is. */
  export let current = -1;

  /** Set to `true` to show the line number. */
  export let lineNumbers = true;

  /** Set to `true` to show the time. */
  export let timestamps = false;

  /** Set to `true` to leave room for a level label. */
  export let levelColumn = false;

  /** Set to `true` to link the URLs in the line. */
  export let links = true;

  /** Set to `true` when the line is in the selected range. */
  export let selected = false;

  /**
   * The luminance of the page behind the line, for keeping 256-color and
   * truecolor text readable. `null` leaves those colors as written.
   * @type {number | null}
   */
  export let backgroundLuminance = null;

  /** Specify the lowest contrast ratio those colors may have. */
  export let minContrast = 4.5;

  /**
   * Specify the label of a level.
   * @type {(level: import("../utils/log-lines.js").LogLevel) => string}
   */
  export let levelText;

  /**
   * Specify the label of a line number button.
   * @type {(line: number) => string}
   */
  export let lineLabelText;

  import { createEventDispatcher } from "svelte";
  import { ensureContrast } from "../utils/ansi.js";
  import { parseHex, relativeLuminance } from "../utils/color-contrast.js";
  import { formatLogTime } from "../utils/log-lines.js";
  import { lineParts } from "../utils/log-search.js";

  /** Palette positions for black and white, which read on the page, not a color. */
  const NEUTRAL = new Set(
    /** @type {import("../utils/ansi.js").AnsiColor[]} */ ([0, 7, 8, 15]),
  );
  const DARK_TEXT = "#161616";
  const LIGHT_TEXT = "#ffffff";

  const dispatch = createEventDispatcher();

  /**
   * @param {import("../utils/log-lines.js").LogRow} line
   * @param {import("../utils/log-search.js").LogMatcher | null} search
   * @param {number} currentMatch
   * @param {boolean} linkUrls
   */
  function split(line, search, currentMatch, linkUrls) {
    return lineParts(line, {
      ranges: search ? search.ranges(line.plain) : [],
      current: currentMatch,
      links: linkUrls,
    });
  }

  /**
   * A palette position is themed by the stylesheet. Anything else is a CSS
   * color, or the page's own.
   * @param {import("../utils/ansi.js").AnsiColor | undefined} color
   * @param {"text" | "background"} role What the color is for.
   * @param {number | null} luminance
   * @param {number} ratio
   * @returns {string | undefined}
   */
  function resolveColor(color, role, luminance, ratio) {
    if (color === undefined) return undefined;
    if (typeof color === "number") return `var(--ccs-log-ansi-${color})`;
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
   * @param {import("../utils/ansi.js").AnsiStyle} style
   * @returns {string | undefined}
   */
  function pairedColor(style) {
    const { bg, fg } = style;
    if (bg === undefined || (fg !== undefined && !NEUTRAL.has(fg))) {
      return undefined;
    }
    if (typeof bg === "number") return `var(--ccs-log-ansi-on-${bg})`;
    const rgb = parseHex(bg);
    if (!rgb) return undefined;
    return relativeLuminance(rgb) > 0.18 ? DARK_TEXT : LIGHT_TEXT;
  }

  /**
   * A match is drawn in the match colors, whatever color the text had.
   * @param {import("../utils/log-search.js").LinePart} part
   * @param {number | null} luminance
   * @param {number} ratio
   * @returns {string | undefined}
   */
  function foreground(part, luminance, ratio) {
    if (!part.style || part.mark > 0) return undefined;
    return (
      pairedColor(part.style) ??
      resolveColor(part.style.fg, "text", luminance, ratio)
    );
  }

  /**
   * @param {import("../utils/log-search.js").LinePart} part
   * @returns {string | undefined}
   */
  function background(part) {
    if (!part.style || part.mark > 0) return undefined;
    return resolveColor(part.style.bg, "background", null, 0);
  }

  $: parts = split(row, matcher, current, links);
  $: number = row.id + 1;
</script>

<div
  class:bx--log-viewer__line={true}
  class:bx--log-viewer__line--debug={row.level === "debug"}
  class:bx--log-viewer__line--warn={row.level === "warn"}
  class:bx--log-viewer__line--error={row.level === "error"}
  class:bx--log-viewer__line--selected={selected}
  data-line-id={row.id}
>
  {#if lineNumbers || timestamps || levelColumn}
    <span class:bx--log-viewer__gutter={true}>
      {#if lineNumbers}
        <button
          type="button"
          tabindex="-1"
          class:bx--log-viewer__line-number={true}
          aria-label={lineLabelText(number)}
          aria-pressed={selected}
          data-line={number}
          on:click={(event) =>
            dispatch("select", { id: row.id, extend: event.shiftKey })}
        ></button>
      {/if}
      {#if timestamps}
        <span class:bx--log-viewer__time={true}>{formatLogTime(row.time)}</span>
      {/if}
      {#if levelColumn}
        <span class:bx--log-viewer__level={true}
          >{row.level ? levelText(row.level) : ""}</span
        >
      {/if}
    </span>
  {/if}
  <span class:bx--log-viewer__text={true}
    >{#each parts as part, index (index)}{#if part.href || part.mark || part.style}<svelte:element
          this={part.href ? "a" : part.mark ? "mark" : "span"}
          class:bx--log-viewer__mark={part.mark > 0}
          class:bx--log-viewer__mark--current={part.mark === 2}
          class:bx--log-viewer__link={Boolean(part.href)}
          href={part.href}
          target={part.href ? "_blank" : undefined}
          rel={part.href ? "noopener noreferrer" : undefined}
          style:color={foreground(part, backgroundLuminance, minContrast)}
          style:background-color={background(part)}
          style:font-weight={part.style?.bold ? "600" : undefined}
          style:font-style={part.style?.italic ? "italic" : undefined}
          style:opacity={part.style?.dim ? "0.7" : undefined}
          style:text-decoration={part.style?.underline || part.style?.strike
            ? [
                part.style.underline && "underline",
                part.style.strike && "line-through",
              ]
                .filter(Boolean)
                .join(" ")
            : undefined}>{part.text}</svelte:element
        >{:else}{part.text}{/if}{/each}</span
  >
</div>
