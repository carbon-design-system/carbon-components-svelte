<script>
  import {
    Box,
    ContainedList,
    ListDetailItem,
    ListDetailLayout,
    Stack,
    Tag,
    Text,
  } from "carbon-components-svelte";

  const tickets = [
    {
      id: "4821",
      subject: "Export job stalls at 90%",
      from: "Priya Raman",
      status: "Open",
      type: "red",
      body: "The nightly export to object storage reaches 90% and stops. The job log shows no error, and a retry stalls at the same point.",
    },
    {
      id: "4819",
      subject: "Invoice PDF shows the wrong tax rate",
      from: "Marcus Webb",
      status: "Pending",
      type: "blue",
      body: "Invoices for the Frankfurt region list 19% where the contract says 7%. Three customers have reported it since Monday.",
    },
    {
      id: "4816",
      subject: "SSO login loops on Safari",
      from: "Aiko Tanaka",
      status: "Open",
      type: "red",
      body: "After the identity provider redirects back, Safari returns to the sign-in page. Chrome and Firefox are not affected.",
    },
    {
      id: "4812",
      subject: "Webhook retries exceed the documented limit",
      from: "Tomás Herrera",
      status: "Resolved",
      type: "green",
      body: "A failing endpoint received 12 retries; the documentation says 5. Fixed in the 2.14 release.",
    },
    {
      id: "4809",
      subject: "Dashboard widgets reset after a theme change",
      from: "Leah Okafor",
      status: "Pending",
      type: "blue",
      body: "Switching to the dark theme restores the default widget layout and drops the saved filters.",
    },
  ];

  let selectedId = "";

  $: ticket = tickets.find((item) => item.id === selectedId);
</script>

<Box height="24rem" border="subtle">
  <ListDetailLayout
    bind:selectedId
    syncUrl={false}
    listLabel="Tickets"
    detailLabel={ticket ? ticket.subject : "Ticket"}
    backText="Back to tickets"
    emptyText="Select a ticket"
  >
    <ContainedList slot="list" labelText="Tickets" hideLabel>
      {#each tickets as item (item.id)}
        <ListDetailItem id={item.id}>
          <Stack gap={2}>
            <Text type="heading-compact-01">{item.subject}</Text>
            <Text type="helper-text-01" color="secondary">
              #{item.id} · {item.from}
            </Text>
          </Stack>
        </ListDetailItem>
      {/each}
    </ContainedList>
    <Stack slot="detail" gap={5}>
      <Text tag="h2" type="heading-04">{ticket?.subject}</Text>
      <Stack gap={3} orientation="horizontal">
        <Tag type={ticket?.type}>{ticket?.status}</Tag>
        <Text color="secondary">#{ticket?.id} from {ticket?.from}</Text>
      </Stack>
      <Text>{ticket?.body}</Text>
    </Stack>
  </ListDetailLayout>
</Box>
