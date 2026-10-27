<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import UnsavedChangesPrompt from "carbon-components-svelte/UnsavedChanges/UnsavedChangesPrompt.svelte";
  import { trackUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { TrackUnsavedChangesParams } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { UnsavedChangesStore } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";
  import type { Action } from "svelte/action";

  export let store: UnsavedChangesStore;
  export let kind: "modal" | "composed" | "sidepanel" = "modal";
  export let open = true;

  let name = "Ada";

  const actions: Array<
    [
      Action<HTMLFormElement, TrackUnsavedChangesParams>,
      TrackUnsavedChangesParams,
    ]
  > = [[trackUnsavedChanges, { store }]];
  // `form.reset()` would blank the bound field (it restores the markup
  // default), so a discard assigns the saved value back.
  const guard = store.closeGuard(() => {
    open = false;
    name = "Ada";
  });
</script>

{#if kind === "modal"}
  <Modal
    bind:open
    modalHeading="Edit profile"
    primaryButtonText="Save"
    secondaryButtons={[{ text: "Cancel" }]}
    on:close={guard}
    on:click:button--secondary={() => guard()}
  >
    <Form {actions}>
      <TextInput labelText="Name" bind:value={name} />
    </Form>
  </Modal>
{:else if kind === "composed"}
  <ComposedModal bind:open on:close={guard}>
    <ModalHeader title="Edit profile" />
    <ModalBody>
      <Form {actions}>
        <TextInput labelText="Name" bind:value={name} />
      </Form>
    </ModalBody>
  </ComposedModal>
{:else}
  <SidePanel bind:open title="Edit profile" on:close={guard}>
    <Form {actions}>
      <TextInput labelText="Name" bind:value={name} />
    </Form>
  </SidePanel>
{/if}

<button type="button" on:click={() => (open = true)}>Reopen</button>
<p data-testid="open">{open}</p>
<p data-testid="name">{name}</p>
<UnsavedChangesPrompt {store} />
