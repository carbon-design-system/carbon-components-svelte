<script>
  /**
   * Specify the size of the search input.
   * Inherits the parent `Form` size when unset, otherwise `"xl"`.
   * @type {"xs" | "sm" | "lg" | "xl"}
   * @default "xl"
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

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext("carbon:FormSize");
  $: effectiveSize = size ?? $formSize ?? "xl";
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
