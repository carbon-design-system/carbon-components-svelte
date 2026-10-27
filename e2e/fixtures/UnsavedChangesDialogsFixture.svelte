<script>
  import {
    Button,
    ComposedModal,
    createUnsavedChanges,
    Form,
    Modal,
    ModalBody,
    ModalHeader,
    SidePanel,
    TextInput,
    trackUnsavedChanges,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  const kind = new URLSearchParams(location.search).get("kind") ?? "modal";
  const unsaved = createUnsavedChanges();
  const { dirty } = unsaved;
  const actions = [[trackUnsavedChanges, { store: unsaved }]];

  let open = false;
  let name = "Ada";

  // `form.reset()` would blank the bound field, so a discard assigns the
  // saved value back.
  const guard = unsaved.closeGuard(() => {
    open = false;
    name = "Ada";
  });
</script>

<Button on:click={() => (open = true)}>Edit profile</Button>
<p data-testid="state">
  {open ? "open" : "closed"}:{$dirty ? "dirty" : "clean"}
</p>

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

<UnsavedChangesPrompt store={unsaved} />
