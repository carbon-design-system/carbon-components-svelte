<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";
</script>

<CopyButton
  text="text"
  on:click
  on:copy
  copy="{(text) => text}"
  feedback="Copied to clipboard"
/>
