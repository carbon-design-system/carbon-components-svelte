<script lang="ts">
  import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";

  // InlineEdit requires its labels, so the contract renders it through
  // this host, which supplies them and passes everything else through.
  export let value = "";
</script>

<InlineEdit
  bind:value
  labelText="Field"
  editLabel="Edit"
  saveLabel="Save"
  cancelLabel="Cancel"
  {...$$restProps}
/>
