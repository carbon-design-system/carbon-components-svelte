<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import type { ComponentProps } from "svelte";

  export let show = true;
  export let open = true;
  export let transition: ComponentProps<InlineNotification>["transition"] =
    undefined;
  export let onOutroEnd: () => void = () => {};
  export let hideOnClose = false;
  export let onClose: () => void = () => {};
</script>

{#if show}
  <InlineNotification
    {open}
    {transition}
    title="Saved"
    subtitle="Your changes were saved."
    on:close={() => {
      if (hideOnClose) show = false;
      onClose();
    }}
    on:outroend={onOutroEnd}
  >
    <svelte:fragment slot="actions">
      <button type="button">Undo</button>
    </svelte:fragment>
    <p>More detail</p>
  </InlineNotification>
{/if}
