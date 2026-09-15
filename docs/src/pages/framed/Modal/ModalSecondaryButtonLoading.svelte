<script>
  import { Button, Modal } from "carbon-components-svelte";

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

<Modal
  bind:open
  modalHeading="Save changes"
  primaryButtonText="Save"
  secondaryButtons={[
    {
      text: "Save as draft",
      kind: "secondary",
      loading: savingDraft,
      loadingDescription: "Saving...",
    },
  ]}
  preventCloseOnClickOutside={savingDraft}
  on:click:button--secondary={({ detail }) => {
    if (detail.text === "Save as draft") onSaveDraft();
  }}
  on:submit={() => (open = false)}
>
  <p>Save your changes to the Cloudant database configuration.</p>
</Modal>
