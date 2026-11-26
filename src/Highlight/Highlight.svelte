<script>
  /**
   * Specify the text to show.
   */
  export let text = "";

  /**
   * Specify what to mark. A string is split on whitespace into terms, and each
   * term is marked wherever it occurs. Pass an array to mark phrases as they
   * are. Case, diacritics and full-width forms are ignored: `cafe` marks
   * `Café`.
   * @type {string | string[]}
   */
  export let query = "";

  /**
   * Specify the ranges to mark (offsets into `text`), such as the ones
   * `matchText` or `fuzzyMatchText` return. When set, `query` is ignored.
   * Ranges are clamped to `text` and widened to whole characters.
   * @type {undefined | Array<{ start: number; end: number }>}
   */
  export let ranges = undefined;

  /**
   * Specify where a match may begin: anywhere (`"substring"`), at the start of a
   * word (`"word-start"`), or at the start of the text (`"prefix"`).
   * @type {"substring" | "word-start" | "prefix"}
   */
  export let mode = "substring";

  /**
   * Set to `true` to match upper and lower case apart.
   */
  export let caseSensitive = false;

  /**
   * Set to `false` to tell `e`, `é` and `ê` apart.
   */
  export let ignoreDiacritics = true;

  /**
   * Specify how a match looks. `"background"` fills it; `"bold"` makes it
   * heavier with no fill. Use `"background"` for Arabic and other cursive
   * scripts: a heavier weight inside a word breaks the joined letters.
   * @type {"background" | "bold"}
   */
  export let variant = "background";

  /**
   * Set to `true` to mark with a `span` instead of a `mark`. Screen readers
   * that announce `mark` as "highlighted" then stay quiet, which suits a long
   * list of results. The look is the same.
   */
  export let decorative = false;

  /**
   * Specify a class to add to each match element.
   */
  export let markClass = "";

  import {
    matchText,
    normalizeRanges,
    splitByRanges,
  } from "../utils/text-match.js";

  $: resolved = ranges
    ? normalizeRanges(text ?? "", ranges)
    : matchText(text ?? "", query, { mode, caseSensitive, ignoreDiacritics });
  $: parts = splitByRanges(text ?? "", resolved);
  $: classes = `bx--highlight__mark${variant === "bold" ? " bx--highlight__mark--bold" : ""}${markClass ? ` ${markClass}` : ""}`;
</script>

{#each parts as part, index (index)}{#if part.match}{#if decorative}<span
        class={classes}>{part.text}</span
      >{:else}<mark class={classes}>{part.text}</mark
      >{/if}{:else}{part.text}{/if}{/each}
