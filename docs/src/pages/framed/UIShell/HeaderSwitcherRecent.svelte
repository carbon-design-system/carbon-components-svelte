<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderSwitcher,
    LocalStorage,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";

  const items = [
    { id: "acme", text: "Acme Corp", description: "Engineering" },
    { id: "globex", text: "Globex Industries", description: "Sales" },
    { id: "initech", text: "Initech", description: "Platform" },
    { id: "hooli", text: "Hooli", description: "Search" },
    { id: "stark", text: "Stark Industries", description: "Research" },
  ];

  let selectedId = "acme";
  /** @type {string[]} */
  let recentIds = [];

  $: active = items.find((item) => item.id === selectedId);
</script>

<!-- Reads the list on mount and writes it after every switch. -->
<LocalStorage key="header-switcher-recent" bind:value={recentIds} />

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderSwitcher {items} bind:selectedId bind:recentIds searchThreshold={10} />
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>{active?.text}</h1>
        <p>
          Switch accounts, then reload this page: the last ones stay listed.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
