<script>
  /**
   * Specify the size of the search input.
   * Inherits the parent `Form` size when unset, otherwise `"lg"` (40px),
   * as in Carbon v11. Also accepts Carbon v11's `"md"` (`"lg"`, 40px).
   * Carbon v11's 48px `lg` is `"xl"` here.
   * @type {"xs" | "sm" | "md" | "lg" | "xl"}
   * @default "lg"
   */
  export let size = undefined;

  /**
   * Set to `true` to hide the label text.
   * @deprecated has no effect -- Search's label is always visually
   * hidden, so the skeleton draws no label.
   */
  // svelte-ignore unused-export-let
  export let hideLabel = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { normalizeSize, SEARCH_SIZE_ALIASES } from "../utils/size-aliases.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(
    size ?? $formSize ?? "lg",
    SEARCH_SIZE_ALIASES,
  );
</script>

<div
  class:bx--skeleton={true}
  class:bx--search--xs={effectiveSize === "xs"}
  class:bx--search--sm={effectiveSize === "sm"}
  class:bx--search--lg={effectiveSize === "lg"}
  class:bx--search--xl={effectiveSize === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--search-input={true}></div>
</div>
