<script>
  /**
   * Specify the toolbar size.
   * If unset, the size is inherited from the parent `DataTable`
   * ("xs" for "compact", "sm" for "short", "default" otherwise).
   * @type {"xs" | "sm" | "default"}
   */
  export let size = undefined;

  /**
   * Specify the ARIA label for the toolbar.
   */
  export let ariaLabel = "data table toolbar";

  /**
   * Set to `true` to keep the toolbar pinned while its scroll container
   * scrolls.
   */
  export let sticky = false;

  /**
   * Distance from the top edge while stuck. Numbers are treated as
   * pixels; strings may be any CSS length (for example `"3rem"`).
   *
   * If unset, defaults to `0`, or to the fixed UI Shell header height
   * (48px) when a `Header` is rendered on the page, so the toolbar
   * doesn't stick underneath it. Set explicitly (including `0`) to opt
   * out.
   * @type {number | string}
   */
  export let stickyOffset = undefined;

  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { isHeaderRendered } from "../UIShell/nav-store.js";
  import { toCssLength } from "../utils/css-length.js";

  // Matches `.bx--header`'s fixed height (`mini-units(6)` in
  // _header.scss); Header has no prop to override it.
  const UI_SHELL_HEADER_HEIGHT = 48;

  let ref = null;

  const dataTableCtx = getContext("carbon:DataTable");
  /** @type {import("svelte/store").Writable<"compact" | "short" | "medium" | "tall" | undefined> | undefined} */
  const tableSize = dataTableCtx?.tableSize;

  /** @type {Record<"compact" | "short" | "medium" | "tall", "xs" | "sm" | "default">} */
  const TOOLBAR_SIZE_BY_TABLE_SIZE = {
    compact: "xs",
    short: "sm",
    medium: "default",
    tall: "default",
  };

  // `$tableSize` is safe when `tableSize` is undefined: Svelte's auto-subscription no-ops on null/undefined stores.
  $: inheritedSize = $tableSize
    ? TOOLBAR_SIZE_BY_TABLE_SIZE[$tableSize]
    : undefined;
  $: effectiveSize = size ?? inheritedSize ?? "default";
  $: effectiveStickyOffset =
    stickyOffset ?? ($isHeaderRendered ? UI_SHELL_HEADER_HEIGHT : 0);

  /**
   * @type {import("svelte/store").Writable<"xs" | "sm" | "default">}
   */
  const toolbarSize = writable(effectiveSize);
  $: toolbarSize.set(effectiveSize);

  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const overflowVisible = writable(false);

  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const batchActionsActive = writable(false);

  /**
   * @type {(visible: boolean) => void}
   */
  function setOverflowVisible(visible) {
    overflowVisible.set(visible);
    if (ref) ref.style.overflow = visible ? "visible" : "inherit";
  }

  setContext("carbon:Toolbar", {
    overflowVisible,
    setOverflowVisible,
    batchActionsActive,
    getRef: () => ref,
    toolbarSize,
  });
</script>

<section
  bind:this={ref}
  tabindex="-1"
  aria-label={ariaLabel}
  class:bx--table-toolbar={true}
  class:bx--table-toolbar--xs={effectiveSize === "xs"}
  class:bx--table-toolbar--small={effectiveSize === "sm"}
  class:bx--table-toolbar--normal={effectiveSize === "default"}
  class:bx--table-toolbar--sticky={sticky}
  style:z-index={1}
  style:top={sticky ? toCssLength(effectiveStickyOffset) : undefined}
  {...$$restProps}
>
  <slot />
</section>
