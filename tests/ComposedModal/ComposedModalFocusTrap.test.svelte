<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalFooter from "carbon-components-svelte/ComposedModal/ModalFooter.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let open = false;
</script>

<ComposedModal bind:open on:open on:close>
  <ModalHeader title="A11y issue" />
  <ModalBody hasScrollingContent>
    <Dropdown
      labelText="Select source"
      selectedId="0"
      items={[
        { id: "0", text: "First item" },
        { id: "1", text: "Second item" },
      ]}
    />
    <TextInput placeholder="text" name="text" labelText="Login" />
    <TextInput placeholder="password" type="password" labelText="Password" />
  </ModalBody>
  <ModalFooter primaryButtonText="OK" secondaryButtonText="Cancel" />
</ComposedModal>
