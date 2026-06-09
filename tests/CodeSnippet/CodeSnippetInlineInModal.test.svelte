<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
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
