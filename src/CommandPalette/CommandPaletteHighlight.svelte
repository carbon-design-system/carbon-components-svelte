<script>
  /**
   * Renders text with fuzzy-query matches emphasized.
   * Used by custom item slots; the default item renderer inlines this logic.
   */

  /** @type {string} */
  export let text = "";

  /** @type {string} */
  export let query = "";

  import { fuzzyMatch, highlightSegments } from "../utils/fuzzyMatch.js";

  $: matchResult = fuzzyMatch(text, query);
  $: segments = highlightSegments(text, matchResult.indices);
  $: labelHtml = segmentsToHtml(segments);

  function escapeHtml(raw) {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function segmentsToHtml(parts) {
    return parts
      .map((part) =>
        part.match
          ? `<strong class="bx--cmd-palette__option-match">${escapeHtml(part.text)}</strong>`
          : escapeHtml(part.text),
      )
      .join("");
  }
</script>

{@html labelHtml}
