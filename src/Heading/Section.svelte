<script>
  // @ts-check

  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   */

  /**
   * Specify the level the section should start at.
   * @type {SectionLevel}
   */
  export let level = 1;

  /**
   * Specify the tag name
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "section";

  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";

  /** @type {undefined | SectionLevel} */
  const parentLevel = getContext("Section");

  /** @type {import ("svelte/store").Writable<SectionLevel>} */
  const internalLevel = writable(level);

  if (typeof parentLevel === "number") {
    // @ts-expect-error
    internalLevel.set(Math.min(parentLevel + 1, 6));
  }

  // Custom level should override the inferred parent level.
  if (level !== 1) {
    internalLevel.set(level);
  }

  setContext("Section", $internalLevel);
</script>

<svelte:element this="{tag}"><slot /></svelte:element>
