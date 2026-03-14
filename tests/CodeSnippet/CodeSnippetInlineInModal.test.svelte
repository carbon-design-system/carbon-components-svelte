<script lang="ts">
  import { CodeSnippet, Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalTooltip: ComponentProps<CodeSnippet>["portalTooltip"] =
    undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <CodeSnippet
    type="inline"
    code="npm install"
    copyLabel="Copy code"
    {portalTooltip}
  />
</Modal>
