<script>
  import {
    ContainedList,
    ContainedListItem,
    Content,
    Header,
    HeaderNav,
    HeaderNavItem,
    PageHeader,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const backups = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    text: `Backup ${24 - index} completed`,
  }));
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderNav>
    <HeaderNavItem href="/" text="Resources" />
    <HeaderNavItem href="/" text="Billing" />
  </HeaderNav>
</Header>

<Content style="padding: 0">
  <PageHeader
    sticky
    stickyOffset="stack"
    title="db-prod-01"
    subtitle="PostgreSQL 16 · us-south"
  />
  <Toolbar sticky stickyOffset="stack">
    <ToolbarContent>
      <ToolbarSearch labelText="Filter backups" />
    </ToolbarContent>
  </Toolbar>
  <ContainedList labelText="Backups" hideLabel>
    {#each backups as backup (backup.id)}
      <ContainedListItem>{backup.text}</ContainedListItem>
    {/each}
  </ContainedList>
</Content>
