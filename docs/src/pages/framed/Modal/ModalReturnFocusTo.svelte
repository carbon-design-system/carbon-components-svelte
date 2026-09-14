<script>
  import {
    Button,
    ContainedList,
    ContainedListItem,
    Modal,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let items = [
    { id: 1, name: "API key — mobile app" },
    { id: 2, name: "API key — internal dashboard" },
    { id: 3, name: "API key — CI pipeline" },
  ];

  let open = false;
  let pendingId = null;
  let headingRef;

  function confirmDelete(id) {
    pendingId = id;
    open = true;
  }

  function deleteItem() {
    items = items.filter((item) => item.id !== pendingId);
    open = false;
  }
</script>

<ContainedList kind="on-page">
  <svelte:fragment slot="labelChildren">
    <span bind:this={headingRef} tabindex="-1">API keys</span>
  </svelte:fragment>
  {#each items as item (item.id)}
    <ContainedListItem>
      {item.name}
      <svelte:fragment slot="action">
        <Button
          kind="ghost"
          size="small"
          icon={TrashCan}
          iconDescription="Delete {item.name}"
          tooltipAlignment="end"
          on:click={() => confirmDelete(item.id)}
        />
      </svelte:fragment>
    </ContainedListItem>
  {/each}
</ContainedList>

<Modal
  bind:open
  danger
  modalHeading="Delete API key"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  returnFocusTo={() => headingRef}
  on:click:button--secondary={() => (open = false)}
  on:submit={deleteItem}
>
  <p>This action can't be undone.</p>
</Modal>
