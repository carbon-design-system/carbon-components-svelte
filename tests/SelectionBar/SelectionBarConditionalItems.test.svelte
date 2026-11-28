<script lang="ts">
  import SelectionBar from "carbon-components-svelte/SelectionBar/SelectionBar.svelte";

  export let showNotice = false;
</script>

<SelectionBar count={10}>
  <svelte:fragment slot="items">
    {#if showNotice}
      <p>All 10 incidents on this page are selected.</p>
    {/if}
  </svelte:fragment>
</SelectionBar>
