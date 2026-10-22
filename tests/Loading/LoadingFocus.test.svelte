<script lang="ts">
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let active = false;
  export let withOverlay = true;
  export let modalOpen = false;
</script>

<button type="button">Save</button>
<button type="button">Cancel</button>

<Loading {active} {withOverlay} description="Saving changes" />

<Modal
  open={modalOpen}
  passiveModal
  modalHeading="Session expiring"
  iconDescription="Close"
/>
