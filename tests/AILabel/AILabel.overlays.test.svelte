<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let sortable = false;
  export let expandable = false;

  const headers = [
    { key: "name", value: "Service" },
    { key: "forecast", value: "Forecast" },
  ] as const;
  const rows = [
    { id: "a", name: "billing-api", forecast: "+12%", ai: true },
    { id: "b", name: "search", forecast: "+3%", ai: false },
  ];
</script>

<div data-testid="table">
  <DataTable
    title="Services"
    {headers}
    {rows}
    {sortable}
    {expandable}
    expandedRowIds={expandable ? ["a"] : []}
  >
    <svelte:fragment slot="decorator"><AILabel /></svelte:fragment>
    <svelte:fragment slot="headerDecorator" let:header>
      {#if header.key === "forecast"}
        <AILabel />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="rowDecorator" let:row>
      {#if row.ai}
        <AILabel />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="expandedRow">Details</svelte:fragment>
  </DataTable>
</div>
<div data-testid="plain-table">
  <DataTable {headers} {rows} />
</div>
<div data-testid="modal">
  <Modal open modalHeading="Forecast" passiveModal>
    <AILabel slot="decorator" />
    Body
  </Modal>
</div>
<div data-testid="composed-modal">
  <ComposedModal open>
    <ModalHeader title="Composed" />
    <ModalBody>Body</ModalBody>
    <AILabel slot="decorator" />
  </ComposedModal>
</div>
