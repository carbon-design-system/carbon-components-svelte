<script lang="ts">
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";

  export let fluid = true;
</script>

<TextArea {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</TextArea>
