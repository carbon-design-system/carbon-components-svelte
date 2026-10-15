<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  /** Which component gets the rest props. */
  export let under: "toolbar" | "search" = "toolbar";
</script>

<Toolbar {...under === "toolbar" ? $$restProps : {}}>
  <ToolbarContent>
    <ToolbarSearch {...under === "search" ? $$restProps : {}} />
  </ToolbarContent>
</Toolbar>
