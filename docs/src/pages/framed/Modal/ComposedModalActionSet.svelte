<script>
  import {
    ActionSet,
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Button on:click={() => (open = true)}>Continue setup</Button>

<ComposedModal bind:open>
  <ModalHeader title="Continue setup" />
  <ModalBody>
    <p>Review this step, go back, or continue to the next one.</p>
  </ModalBody>
  <ModalFooter>
    <ActionSet size="lg" disableStacking>
      <Button kind="ghost" on:click={() => (open = false)}>Cancel</Button>
      <Button kind="secondary">Previous</Button>
      <Button on:click={() => (open = false)}>Next</Button>
    </ActionSet>
  </ModalFooter>
</ComposedModal>
