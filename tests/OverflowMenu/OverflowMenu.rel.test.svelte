<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  export let testCase:
    | "default"
    | "override"
    | "empty"
    | "no-target"
    | "custom-rel" = "default";
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
  {:else if testCase === "empty"}
    <OverflowMenuItem
      href="https://example.com"
      target="_blank"
      rel=""
      text="Test link"
    />
  {:else if testCase === "no-target"}
    <OverflowMenuItem
      href="https://example.com"
      target="_self"
      text="Test link"
    />
  {:else if testCase === "custom-rel"}
    <OverflowMenuItem
      href="https://example.com"
      target="_self"
      rel="nofollow"
      text="Test link"
    />
  {/if}
</OverflowMenu>
