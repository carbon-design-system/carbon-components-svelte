<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ListDetailItem from "carbon-components-svelte/ListDetailLayout/ListDetailItem.svelte";
  import ListDetailLayout from "carbon-components-svelte/ListDetailLayout/ListDetailLayout.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedId = "";
  export let loading = false;
  export let syncUrl = true;
  export let historyMode: ComponentProps<ListDetailLayout>["historyMode"] =
    "auto";
  export let resizable = false;
  export let onChange: (id: string) => void = () => {};

  const tickets = [
    { id: "101", title: "Login fails on Safari" },
    { id: "102", title: "Export hangs at 90%" },
    { id: "103", title: "Dark theme contrast" },
  ];

  $: current = tickets.find((ticket) => ticket.id === selectedId);
</script>

<ListDetailLayout
  bind:selectedId
  {loading}
  {syncUrl}
  {historyMode}
  {resizable}
  listLabel="Tickets"
  detailLabel={current?.title ?? "Ticket"}
  emptyText="Select a ticket"
  on:change={(event) => onChange(event.detail.selectedId)}
>
  <ContainedList slot="list" labelText="Tickets" hideLabel>
    {#each tickets as ticket (ticket.id)}
      <ListDetailItem id={ticket.id}>{ticket.title}</ListDetailItem>
    {/each}
  </ContainedList>
  <svelte:fragment slot="detail">
    <h2>{current?.title}</h2>
    <p>Ticket {selectedId}</p>
  </svelte:fragment>
</ListDetailLayout>
