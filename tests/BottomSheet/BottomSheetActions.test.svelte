<script lang="ts">
  import BottomSheet from "carbon-components-svelte/BottomSheet/BottomSheet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let open = true;
</script>

<BottomSheet bind:open title="Filters" on:close>
  Body
  <svelte:fragment slot="actions">
    <Button kind="secondary">Clear</Button>
    <Button>Apply</Button>
  </svelte:fragment>
</BottomSheet>
