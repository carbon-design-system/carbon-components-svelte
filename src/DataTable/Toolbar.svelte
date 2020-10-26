<script>
  /**
   * Specify the toolbar size
   * @type {"sm" | "default"} [size="default"]
   */
  export let size = "default";

  import { setContext } from "svelte";

  let ref = null;

  setContext("Toolbar", {
    setOverflow: (toggled) => {
      if (ref) {
        if (toggled) {
          ref.style.overflow = "visible";
        } else {
          ref.removeAttribute("style");
        }
      }
    },
  });
</script>

<section
  bind:this="{ref}"
  aria-label="data table toolbar"
  class:bx--table-toolbar="{true}"
  class:bx--table-toolbar--small="{size === 'sm'}"
  class:bx--table-toolbar--normal="{size === 'default'}"
  {...$$restProps}
>
  <slot />
</section>
