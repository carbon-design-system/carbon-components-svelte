<script>
  import {
    Button,
    DataTable,
    Modal,
    Popconfirm,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const params = new URLSearchParams(location.search);
  // `?sticky` puts the table in its own scroll box; `?rowClick` listens for
  // clicks on a row.
  const sticky = params.has("sticky");

  let log = [];
  /** @param {string} entry */
  const note = (entry) => (log = [...log, entry]);

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
    { key: "actions", value: "Actions" },
  ];
  let rows = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    name: `Service ${i + 1}`,
    region: "us-south",
  }));

  let modalOpen = params.has("modal");
  let modalClosed = 0;
  // For a test to close the modal with no pointer event.
  /** @type {any} */ (window).closeModal = () => (modalOpen = false);
</script>

<div
  style="width: 420px; max-width: 100%; box-sizing: border-box; padding: 1rem"
>
  <DataTable
    {headers}
    {rows}
    stickyHeader={sticky}
    stickyHeaderMaxHeight={sticky ? 240 : undefined}
    on:click:row={({ detail }) => note(`row:${detail.id}`)}
  >
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "actions"}
        <Popconfirm
          title="Delete {row.name}?"
          description="This removes it from every region."
          confirmText="Delete"
          direction="top"
          align="end"
          on:confirm={() => {
            note(`deleted:${row.id}`);
            rows = rows.filter((r) => r.id !== row.id);
          }}
        >
          <Button
            data-testid="delete-{row.id}"
            kind="danger-ghost"
            size="small"
            iconDescription="Delete {row.name}"
            icon={TrashCan}
            iconOnly
          />
        </Popconfirm>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</div>

<Button data-testid="open-modal" on:click={() => (modalOpen = true)}>
  Open modal
</Button>

<Modal
  bind:open={modalOpen}
  modalHeading="Edit project"
  primaryButtonText="Save"
  secondaryButtonText="Close"
  on:close={() => (modalClosed += 1)}
>
  <p>Remove a member from this project.</p>
  <Popconfirm
    title="Remove Ada?"
    confirmText="Remove"
    on:confirm={() => note("removed")}
  >
    <Button data-testid="modal-trigger" kind="danger-tertiary" size="small">
      Remove Ada
    </Button>
  </Popconfirm>
</Modal>

<pre data-testid="log">{JSON.stringify(log)}</pre>
<pre data-testid="modal-closed">{modalClosed}</pre>
