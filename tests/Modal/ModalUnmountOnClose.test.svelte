<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let open = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

{#if open}
  <Modal
    bind:open
    modalHeading="Unmount On Close"
    on:close={(e) => onclose?.(e)}
  />
{/if}
