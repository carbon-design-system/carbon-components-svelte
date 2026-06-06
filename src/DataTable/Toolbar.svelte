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

  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";

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
  const setOverflowVisible = (visible) => {
    overflowVisible.set(visible);
    if (ref) ref.style.overflow = visible ? "visible" : "inherit";
  };

  setContext("carbon:Toolbar", {
    overflowVisible,
    setOverflowVisible,
    batchActionsActive,
  });
</script>

<section
  bind:this={ref}
  aria-label={ariaLabel}
  class:bx--table-toolbar={true}
  class:bx--table-toolbar--xs={effectiveSize === "xs"}
  class:bx--table-toolbar--small={effectiveSize === "sm"}
  class:bx--table-toolbar--normal={effectiveSize === "default"}
  style:z-index={1}
  {...$$restProps}
>
  <slot />
</section>
