<script>
  import CreateFlowModal from "./CreateFlowModal.svelte";
  import CreateFlowPage from "./CreateFlowPage.svelte";
  import CreateFlowTearsheet from "./CreateFlowTearsheet.svelte";

  // `?layout=modal` (three steps in a ComposedModal) and `?layout=page` (a
  // full page, with the rail beside the form). The default is the tearsheet.
  const layout = new URLSearchParams(location.search).get("layout");
</script>

{#if layout === "modal"}
  <CreateFlowModal />
{:else if layout === "page"}
  <CreateFlowPage />
{:else}
  <CreateFlowTearsheet />
{/if}
