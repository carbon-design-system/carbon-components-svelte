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
    UserAvatar,
  } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";

  const workspaces = [
    { id: "acme", name: "Acme Corp" },
    { id: "globex", name: "Globex Industries" },
  ];

  let activeId = "acme";

  $: active = workspaces.find((workspace) => workspace.id === activeId);
</script>

<Header>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderSwitcher text={active.name}>
    <svelte:fragment slot="avatar">
      <UserAvatar name={active.name} backgroundColor="auto" size="sm" />
    </svelte:fragment>
    <ProfileMenuList>
      {#each workspaces as workspace (workspace.id)}
        <ProfileMenuItem
          icon={workspace.id === activeId ? Checkmark : undefined}
          on:click={() => (activeId = workspace.id)}
        >
          {workspace.name}
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
          No <code>companyName</code> or <code>platformName</code> is set, so
          the header renders without a name link. <code>HeaderSwitcher</code> is
          the only brand element.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
