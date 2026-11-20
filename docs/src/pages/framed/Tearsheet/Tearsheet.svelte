<script>
  import {
    Button,
    Content,
    Dropdown,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;

  const sources = [
    { id: "postgres", text: "PostgreSQL" },
    { id: "snowflake", text: "Snowflake" },
    { id: "bigquery", text: "BigQuery" },
  ];
</script>

<Content>
  <Button on:click={() => (open = true)}>Create integration</Button>
</Content>

<Tearsheet
  bind:open
  labelText="Step 2 of 4"
  titleText="Create integration"
  descriptionText="Connect a data source and map its fields."
>
  <Stack gap={6}>
    <TextInput labelText="Connection name" placeholder="orders-warehouse" />
    <Dropdown labelText="Source" selectedId="postgres" items={sources} />
    <TextInput labelText="Host" placeholder="db.example.com" />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Next</Button>
  </svelte:fragment>
</Tearsheet>
