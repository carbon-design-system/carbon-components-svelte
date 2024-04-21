<script>
  // @ts-check

  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   */

  import { getContext } from "svelte";

  /** @type {undefined | SectionLevel} */
  const sectionLevel = getContext("Section");

  $: tag = `h${sectionLevel ?? 1}`;
</script>

<svelte:element this="{tag}">
  <slot />
</svelte:element>
