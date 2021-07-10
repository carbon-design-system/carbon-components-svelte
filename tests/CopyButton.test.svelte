<script lang="ts">
  import { CopyButton } from "../types";
</script>

<CopyButton
  text="text"
  on:click
  on:copy
  copy="{(text) => text}"
  feedback="Copied to clipboard"
/>
