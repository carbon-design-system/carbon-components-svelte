<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let open = false;
</script>

<Modal
  bind:open
  modalHeading="Service settings"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <TextInput labelText="Service name" />
  <a href="#docs" tabindex="-1">Naming rules</a>
  <TextInput labelText="Region" />
</Modal>
