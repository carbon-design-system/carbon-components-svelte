<script>
  import {
    ComposedModal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
  } from "carbon-components-svelte";

  let open = true;
  let checked = false;
</script>

<ComposedModal bind:open>
  <ModalHeader label="Changes" title="Confirm changes" />
  <ModalBody hasForm>
    <Checkbox labelText="I have reviewed the changes" bind:checked />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Proceed"
    primaryButtonDisabled="{!checked}"
    secondaryButtons="{[{ text: 'Cancel' }, { text: 'Review' }]}"
    on:click:button--secondary="{({ detail }) => {
      if (detail.text === 'Cancel') open = false;
      if (detail.text === 'Review') console.log('Review');
    }}"
  />
</ComposedModal>
