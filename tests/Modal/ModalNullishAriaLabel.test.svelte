<script lang="ts">
  import { Modal } from "carbon-components-svelte";

  export let open = false;
  export let ariaLabel = "";
  export let primaryButtonText = "";
  export let secondaryButtonText = "";
</script>

<Modal
  bind:open
  aria-label={ariaLabel}
  {primaryButtonText}
  {secondaryButtonText}
>
</Modal>
