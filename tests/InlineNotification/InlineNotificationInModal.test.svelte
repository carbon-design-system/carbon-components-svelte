<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";

  export let onModalClose: (() => void) | undefined = undefined;
</script>

<Modal open passiveModal modalHeading="Modal" on:close={() => onModalClose?.()}>
  <InlineNotification title="Inside modal" />
</Modal>
