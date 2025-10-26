<script>
  import {
    Button,
    Checkbox,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = true;
  let checked = false;
</script>

<Button on:click={() => (open = true)}>Review changes</Button>

<ComposedModal bind:open on:submit={() => (open = false)}>
  <ModalHeader label="Changes" title="Confirm changes" />
  <ModalBody hasForm>
    <Checkbox labelText="I have reviewed the changes" bind:checked />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Proceed"
    primaryButtonDisabled={!checked}
    secondaryButtons={[{ text: "Cancel" }, { text: "Review" }]}
    on:click:button--secondary={({ detail }) => {
      if (detail.text === "Cancel") open = false;
      if (detail.text === "Review") console.log("Review");
    }}
  />
</ComposedModal>
