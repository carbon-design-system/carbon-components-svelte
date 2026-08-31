<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderSwitcher,
    ProfileMenuItem,
    ProfileMenuList,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";

  const accounts = [
    { id: "acme", name: "Acme Corp" },
    { id: "globex", name: "Globex Industries" },
    { id: "initech", name: "Initech" },
  ];

  let activeId = "acme";
  let isOpen = false;

  $: active = accounts.find((account) => account.id === activeId);
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderSwitcher text={active.name} bind:isOpen>
    <ProfileMenuList>
      {#each accounts as account (account.id)}
        <ProfileMenuItem
          icon={account.id === activeId ? Checkmark : undefined}
          on:click={() => {
            activeId = account.id;
            isOpen = false;
          }}
        >
          {account.name}
        </ProfileMenuItem>
      {/each}
    </ProfileMenuList>
  </HeaderSwitcher>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>{active.name}</h1>
        <p>
          No avatar slot on the trigger or the items — a text-only switcher.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
