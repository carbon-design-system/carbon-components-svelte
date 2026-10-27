<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu open>
  <OverflowMenuItem
    text="Save"
    aria-keyshortcuts="Control+S"
    aria-describedby="save-hint"
    data-testid="save"
  />
  <OverflowMenuItem
    href="/docs"
    text="Docs"
    aria-keyshortcuts="Control+D"
    aria-current="page"
  />
</OverflowMenu>
<span id="save-hint">Saves the draft</span>
