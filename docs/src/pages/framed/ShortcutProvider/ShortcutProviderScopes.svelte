<script>
  import {
    Button,
    Modal,
    shortcut,
    ShortcutHelp,
    ShortcutProvider,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
  let message = "Press a shortcut";
</script>

<ShortcutProvider>
  <ShortcutHelp />
  <Stack gap={5}>
    <Stack orientation="horizontal" gap={5} align="center">
      <div
        use:shortcut={{
          keys: "mod+s",
          label: "Save draft",
          onTrigger: () => (message = "Saved the draft"),
        }}
      >
        <Button on:click={() => (message = "Saved the draft")}>
          Save draft
        </Button>
      </div>
      <Button kind="tertiary" on:click={() => (open = true)}>
        Edit profile
      </Button>
    </Stack>
    <p aria-live="polite">{message}</p>
  </Stack>

  <Modal
    bind:open
    modalHeading="Edit profile"
    primaryButtonText="Save profile"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
    on:submit={() => {
      message = "Saved the profile";
      open = false;
    }}
  >
    <ShortcutProvider titleText="Edit profile">
      <div
        use:shortcut={{
          keys: "mod+s",
          label: "Save profile",
          onTrigger: () => {
            message = "Saved the profile";
            open = false;
          },
        }}
      >
        <p>
          Press the save shortcut here: it saves the profile, not the draft.
        </p>
      </div>
    </ShortcutProvider>
  </Modal>
</ShortcutProvider>
