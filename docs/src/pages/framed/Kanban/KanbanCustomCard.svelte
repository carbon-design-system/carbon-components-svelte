<script>
  import {
    Box,
    Kanban,
    Link,
    Stack,
    Tag,
    UserAvatar,
  } from "carbon-components-svelte";

  const columns = [
    { id: "new", title: "New" },
    { id: "active", title: "Active", limit: 3 },
    { id: "resolved", title: "Resolved" },
  ];

  let items = [
    {
      id: "SEC-88",
      column: "new",
      title: "Expired token accepted by the gateway",
      severity: "Critical",
      owner: "Grace Hopper",
    },
    {
      id: "SEC-91",
      column: "new",
      title: "Verbose errors leak stack traces",
      severity: "Low",
      owner: "Alan Turing",
    },
    {
      id: "SEC-76",
      column: "active",
      title: "Rotate the database credentials",
      severity: "High",
      owner: "Ada Lovelace",
    },
  ];
</script>

<Box height="22rem">
  <Kanban aria-label="Security board" {columns} bind:items>
    <svelte:fragment slot="card" let:item>
      <Stack gap={3}>
        <Link href="#{item.id}">{item.id}</Link>
        <span>{item.title}</span>
        <Stack orientation="horizontal" gap={3}>
          <Tag size="sm" type={item.severity === "Critical" ? "red" : "gray"}>
            {item.severity}
          </Tag>
          <UserAvatar size="sm" name={item.owner} backgroundColor="auto" />
        </Stack>
      </Stack>
    </svelte:fragment>
  </Kanban>
</Box>
