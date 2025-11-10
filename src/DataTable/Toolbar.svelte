<script>
  /**
   * Specify the toolbar size
   * @type {"sm" | "default"}
   */
  export let size = "default";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  let ref = null;

  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const overflowVisible = writable(false);

  /**
   * @type {(visible: boolean) => void}
   */
  const setOverflowVisible = (visible) => {
    overflowVisible.set(visible);
    if (ref) ref.style.overflow = visible ? "visible" : "inherit";
  };

  setContext("Toolbar", {
    overflowVisible,
    setOverflowVisible,
  });
</script>

<section
  bind:this={ref}
  aria-label="data table toolbar"
  class:bx--table-toolbar={true}
  class:bx--table-toolbar--small={size === "sm"}
  class:bx--table-toolbar--normal={size === "default"}
  style:z-index={1}
  {...$$restProps}
>
  <slot />
</section>
