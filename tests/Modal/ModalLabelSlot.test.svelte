<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  /** Which label slots to pass: the new name, the deprecated one, or both. */
  export let slots: "labelChildren" | "label" | "both" = "label";
</script>

{#if slots === "labelChildren"}
  <Modal open passiveModal modalHeading="Create database">
    <span slot="labelChildren">New label</span>
    Content
  </Modal>
{:else if slots === "label"}
  <Modal open passiveModal modalHeading="Create database">
    <span slot="label">Cloudant</span>
    Content
  </Modal>
{:else}
  <Modal open passiveModal modalHeading="Create database">
    <span slot="labelChildren">New label</span>
    <span slot="label">Cloudant</span>
    Content
  </Modal>
{/if}
