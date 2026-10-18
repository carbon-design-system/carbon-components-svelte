<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let firstOpen = false;
  export let secondOpen = false;
</script>

<Modal bind:open={firstOpen} modalHeading="First" passiveModal />
<Modal bind:open={secondOpen} modalHeading="Second" passiveModal />
