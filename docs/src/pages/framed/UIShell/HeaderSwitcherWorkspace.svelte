<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderSwitcher,
    ProfileMenuDivider,
    ProfileMenuItem,
    ProfileMenuList,
    Row,
    SkipToContent,
    UserAvatar,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";

  const workspaces = [
    { id: "acme", name: "Acme Corp" },
    { id: "globex", name: "Globex Industries" },
    { id: "initech", name: "Initech" },
    {
      id: "umbrella",
      name: "Umbrella Regional Distribution & Logistics Cooperative",
    },
  ];

  let activeId = "acme";
  let isOpen = false;

  $: active = workspaces.find((workspace) => workspace.id === activeId);
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderSwitcher text={active.name} bind:isOpen>
    <svelte:fragment slot="avatar">
      <UserAvatar name={active.name} backgroundColor="auto" size="sm" />
    </svelte:fragment>
    <ProfileMenuList>
      {#each workspaces as workspace (workspace.id)}
        <ProfileMenuItem
          icon={workspace.id === activeId ? Checkmark : undefined}
          on:click={() => {
            activeId = workspace.id;
            isOpen = false;
          }}
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
    <ProfileMenuDivider />
    <ProfileMenuList>
      <ProfileMenuItem icon={Add}>Create workspace</ProfileMenuItem>
    </ProfileMenuList>
  </HeaderSwitcher>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>{active.name}</h1>
        <p>Switch workspaces from the trigger in the header above.</p>
      </Column>
    </Row>
  </Grid>
</Content>
