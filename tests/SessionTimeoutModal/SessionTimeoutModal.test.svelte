<script lang="ts">
  import SessionTimeoutModal from "carbon-components-svelte/SessionTimeout/SessionTimeoutModal.svelte";
  import type { ComponentProps } from "svelte";

  export let timer: ComponentProps<SessionTimeoutModal>["timer"];
  export let announceAt: ComponentProps<SessionTimeoutModal>["announceAt"] =
    undefined;
  export let onextend: (() => void) | undefined = undefined;
  export let onsignout: (() => void) | undefined = undefined;
  export let onsignin: (() => void) | undefined = undefined;
</script>

<button type="button">Page button</button>
<SessionTimeoutModal
  {timer}
  {announceAt}
  on:extend={() => onextend?.()}
  on:signout={() => onsignout?.()}
  on:signin={() => onsignin?.()}
/>
