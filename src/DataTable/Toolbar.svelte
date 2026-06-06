<script>
  /**
   * Specify the toolbar size.
   * @type {"xs" | "sm" | "default"}
   */
  export let size = "default";

  /**
   * Specify the ARIA label for the toolbar.
   */
  export let ariaLabel = "data table toolbar";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  let ref = null;

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
  class:bx--table-toolbar--xs={size === "xs"}
  class:bx--table-toolbar--small={size === "sm"}
  class:bx--table-toolbar--normal={size === "default"}
  style:z-index={1}
  {...$$restProps}
>
  <slot />
</section>
