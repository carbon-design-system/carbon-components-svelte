<script lang="ts">
  import { CopyButton, InlineNotification } from "../types";
</script>

<InlineNotification
  svx-ignore
  lowContrast
  title="Note:"
  subtitle="By design, the copy button does not copy text to the clipboard. You will need to write your own logic."
  kind="info"
  hideCloseButton
/>

<CopyButton on:click />

<CopyButton on:click feedback="Copied to clipboard" />
