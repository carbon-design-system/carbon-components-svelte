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
  import Enterprise from "carbon-icons-svelte/lib/Enterprise.svelte";

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
      <Enterprise size={16} />
    </svelte:fragment>
    <ProfileMenuList>
      {#each workspaces as workspace (workspace.id)}
        <ProfileMenuItem
          icon={workspace.id === activeId ? Checkmark : undefined}
          on:click={() => (activeId = workspace.id)}
        >
          <svelte:fragment slot="avatar">
            <UserAvatar
              name={workspace.name}
              backgroundColor="auto"
              size="sm"
            />
          </svelte:fragment>
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
          A plain icon in the <code>avatar</code> slot replaces the
          per-workspace photo with a fixed brand icon.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
