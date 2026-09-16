<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
  let savingDraft = false;

  function onSaveDraft() {
    savingDraft = true;
    setTimeout(() => {
      savingDraft = false;
    }, 2000);
  }
</script>

<Button on:click={() => (open = true)}>Save changes</Button>

<ComposedModal
  bind:open
  preventCloseOnClickOutside={savingDraft}
  on:submit={() => (open = false)}
>
  <ModalHeader title="Save changes" />
  <ModalBody>
    <p>Save your changes to the Cloudant database configuration.</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtons={[
    {
      text: "Save as draft",
      kind: "secondary",
      loading: savingDraft,
      loadingDescription: "Saving...",
    },
  ]}
    on:click:button--secondary={({ detail }) => {
    if (detail.text === "Save as draft") onSaveDraft();
  }}
  />
</ComposedModal>
