<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderSwitcher,
    ProfileMenuItem,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const items = [
    {
      id: "acme",
      text: "Acme Corp",
      description: "Engineering",
      group: "Accounts",
    },
    {
      id: "globex",
      text: "Globex Industries",
      description: "Sales",
      group: "Accounts",
    },
    {
      id: "initech",
      text: "Initech",
      description: "Platform",
      group: "Accounts",
    },
    { id: "hooli", text: "Hooli", description: "Search", group: "Accounts" },
    {
      id: "umbrella",
      text: "Umbrella Regional Distribution & Logistics Cooperative",
      description: "Operations",
      group: "Accounts",
    },
    { id: "stark", text: "Stark Industries", group: "Accounts" },
    { id: "wayne", text: "Wayne Enterprises", group: "Accounts" },
    { id: "console", text: "Cloud console", group: "Apps", href: "#console" },
    { id: "billing", text: "Billing", group: "Apps", href: "#billing" },
  ];

  let selectedId = "acme";

  $: active = items.find((item) => item.id === selectedId);
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderSwitcher {items} showDetail bind:selectedId>
    <ProfileMenuItem icon={Add}>Create workspace</ProfileMenuItem>
  </HeaderSwitcher>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>{active?.text}</h1>
        <p>
          Nine items are more than the filter field's threshold of eight, so the
          menu shows it.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
