<script lang="ts">
  import {
    ComposedModal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
  } from "../types";

  let checked = false;
</script>

<ComposedModal open on:close on:click:button--primary>
  <ModalHeader title="Confirm changes" />
  <ModalBody hasForm>
    <Checkbox labelText="I have reviewed the changes" bind:checked />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Proceed"
    primaryButtonDisabled="{!checked}"
    secondaryButtons="{[{ text: 'Cancel' }, { text: 'Duplicate' }]}"
    on:click:button--secondary="{({ detail }) => {
      console.log(detail);
    }}"
  />
</ComposedModal>
