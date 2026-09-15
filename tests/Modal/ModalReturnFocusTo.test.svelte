<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let open = false;
  export let returnFocusTo: HTMLElement | (() => HTMLElement | null) | null =
    null;
</script>

<h2 data-testid="fallback" tabindex="-1">Fallback heading</h2>
<button type="button" data-testid="opener" on:click={() => (open = true)}>
  Open Modal
</button>
<Modal
  bind:open
  modalHeading="Return Focus To Test"
  passiveModal
  hideCloseButton
  {returnFocusTo}
/>
