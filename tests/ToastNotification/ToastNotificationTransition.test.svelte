<script lang="ts">
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
  import type { ComponentProps } from "svelte";

  export let show = true;
  export let open = true;
  export let transition: ComponentProps<ToastNotification>["transition"] =
    undefined;
  export let onOutroEnd: () => void = () => {};
  export let hideOnClose = false;
  export let onClose: () => void = () => {};
</script>

{#if show}
  <ToastNotification
    {open}
    {transition}
    title="Deployed"
    subtitle="Build 42 is live."
    caption="Just now"
    on:close={() => {
      if (hideOnClose) show = false;
      onClose();
    }}
    on:outroend={onOutroEnd}
  >
    <svelte:fragment slot="actions">
      <button type="button">View</button>
    </svelte:fragment>
    <p>More detail</p>
  </ToastNotification>
{/if}
