<script lang="ts">
  import { Modal } from "carbon-components-svelte";

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>Open Modal</button>
<Modal
  bind:open
  modalHeading="Focus Return Test"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
/>
