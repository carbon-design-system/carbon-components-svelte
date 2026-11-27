<script>
  import {
    Button,
    ContainedList,
    ListDetailItem,
    ListDetailLayout,
    Modal,
  } from "carbon-components-svelte";

  // `?breakpoint=lg&responsiveTo=viewport&resizable&loading` set the props,
  // `?width=500px` sizes the frame, and `?modalInside` puts the dialog in
  // the details. `id` is the layout's own.
  const flags = new URLSearchParams(location.search);

  const tickets = Array.from({ length: 40 }, (_, index) => ({
    id: String(index + 1),
    title: `Ticket ${index + 1}: ${
      ["Login fails", "Export hangs", "Dark theme contrast", "Slow search"][
        index % 4
      ]
    }`,
    from: ["Ada", "Grace", "Linus", "Margaret"][index % 4],
  }));

  const modalInside = flags.has("modalInside");

  let selectedId = "";
  let changes = [];
  let dialogOpen = false;

  $: current = tickets.find((ticket) => ticket.id === selectedId);
</script>

<div
  data-testid="frame"
  style:width={flags.get("width") ?? "100%"}
  style:height="480px"
>
  <ListDetailLayout
    data-testid="layout"
    bind:selectedId
    breakpoint={flags.get("breakpoint") ?? "md"}
    responsiveTo={flags.get("responsiveTo") ?? "container"}
    resizable={flags.has("resizable")}
    loading={flags.has("loading")}
    listLabel="Tickets"
    detailLabel={current ? current.title : "Ticket"}
    emptyText="Select a ticket"
    on:change={(event) => (changes = [...changes, event.detail.selectedId])}
  >
    <ContainedList slot="list" labelText="Tickets" hideLabel>
      {#each tickets as ticket (ticket.id)}
        <ListDetailItem id={ticket.id}>
          <strong>{ticket.title}</strong>
          <div>{ticket.from}</div>
        </ListDetailItem>
      {/each}
    </ContainedList>
    <svelte:fragment slot="detail">
      <h2>{current?.title}</h2>
      <p>From {current?.from}. Steps to reproduce are in the attachment.</p>
      <Button size="small" on:click={() => (dialogOpen = true)}>
        Open dialog
      </Button>
      {#if modalInside}
        <Modal
          bind:open={dialogOpen}
          modalHeading="Reply"
          passiveModal
          data-testid="dialog"
        >
          <p>Write a reply.</p>
        </Modal>
      {/if}
    </svelte:fragment>
  </ListDetailLayout>
</div>
{#if !modalInside}
  <Modal
    bind:open={dialogOpen}
    modalHeading="Reply"
    passiveModal
    data-testid="dialog"
  >
    <p>Write a reply.</p>
  </Modal>
{/if}
<div data-testid="changes">{changes.join(",")}</div>
