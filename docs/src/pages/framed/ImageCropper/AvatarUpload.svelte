<script>
  import {
    FileUploaderButton,
    ImageCropper,
    Modal,
    Stack,
    Text,
    UserAvatar,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let files = [];
  let file;
  let open = false;
  let cropper;
  let status = "empty";
  let saving = false;
  let message = "";

  // The avatar shown on the page, and the preview inside the dialog. Both
  // are object URLs, so each is revoked when it is replaced.
  let avatar;
  let preview;
  let previewTimer;

  function replace(current, blob) {
    if (current) URL.revokeObjectURL(current);
    return blob ? URL.createObjectURL(blob) : undefined;
  }

  function pick(event) {
    file = event.detail[0];
    message = "";
    open = true;
    // Clear the input so the same file can be chosen again.
    files = [];
  }

  // Redraw the preview shortly after the crop settles, at the size it shows.
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      if (!cropper) return;
      try {
        preview = replace(
          preview,
          await cropper.toBlob({ type: "image/jpeg", width: 96 }),
        );
      } catch {
        preview = replace(preview, undefined);
      }
    }, 150);
  }

  async function save() {
    saving = true;
    try {
      const blob = await cropper.toBlob({
        type: "image/jpeg",
        quality: 0.9,
        width: 256,
      });
      avatar = replace(avatar, blob);
      open = false;
    } catch (error) {
      // A cross-origin picture without CORS headers can't be read back.
      message = error.message;
    } finally {
      saving = false;
    }
  }

  onMount(() => () => {
    clearTimeout(previewTimer);
    replace(avatar);
    replace(preview);
  });
</script>

<Stack gap={5}>
  <UserAvatar size="xl" name="Ada Lovelace" image={avatar} />
  <FileUploaderButton
    bind:files
    labelText="Choose a photo"
    kind="tertiary"
    accept={[".jpg", ".jpeg", ".png", ".webp"]}
    disableLabelChanges
    on:change={pick}
  />
</Stack>

<Modal
  bind:open
  lazy
  hasScrollingContent
  size="md"
  modalHeading="Crop your photo"
  primaryButtonText="Save"
  primaryButtonDisabled={status !== "ready" || saving}
  secondaryButtonText="Cancel"
  on:click:button--primary={save}
  on:click:button--secondary={() => (open = false)}
>
  <Stack gap={5}>
    <ImageCropper
      bind:this={cropper}
      bind:status
      src={file}
      shape="circle"
      maxZoom={6}
      minWidth={128}
      minHeight={128}
      labelText="Crop your photo"
      on:change={schedulePreview}
      on:load={() => {
        // The Save button is disabled until now, so the dialog's own first
        // focus has nowhere to go: put it on the crop area.
        cropper.focus();
        schedulePreview();
      }}
    />
    <Stack orientation="horizontal" gap={5}>
      <UserAvatar
        size="xl"
        name="Preview"
        image={preview}
        imageDescription=""
      />
      <Text>The photo shows as a circle, 256 pixels across.</Text>
    </Stack>
    {#if message}
      <Text>{message}</Text>
    {/if}
  </Stack>
</Modal>
