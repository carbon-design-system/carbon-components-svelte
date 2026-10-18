<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let testCase: "default" | "override" = "default";
</script>

<OverflowMenu>
  {#if testCase === "default"}
    <OverflowMenuItem
      href="https://example.com"
      target="_blank"
      text="Test link"
    />
  {:else if testCase === "override"}
    <OverflowMenuItem
      href="https://example.com"
      target="_blank"
      rel="noopener"
      text="Test link"
    />
  {/if}
</OverflowMenu>
