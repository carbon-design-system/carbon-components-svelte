<script>
  import {
    Checkbox,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let checked = false;
</script>

<ComposedModal open>
  <ModalHeader label="Changes" title="Confirm changes" />
  <ModalBody hasForm>
    <Checkbox labelText="I have reviewed the changes" bind:checked />
  </ModalBody>
  <ModalFooter primaryButtonText="Proceed" primaryButtonDisabled={!checked} />
</ComposedModal>
