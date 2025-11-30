<script lang="ts">
  import { Modal } from "carbon-components-svelte";

  export let open = false;
  export let formId: string | undefined = undefined;
  export let shouldSubmitOnEnter = true;
  export let onFormSubmit: (e: SubmitEvent) => void = () => {};
</script>

<Modal
  bind:open
  modalHeading="Form Modal"
  primaryButtonText="Submit"
  secondaryButtonText="Cancel"
  hasForm
  {formId}
  {shouldSubmitOnEnter}
  on:open
  on:close
  on:submit
  on:click:button--primary
>
  <form id="test-form" on:submit|preventDefault={onFormSubmit}>
    <input name="username" type="text" data-testid="username-input" />
    <input name="email" type="email" data-testid="email-input" />
  </form>
</Modal>
