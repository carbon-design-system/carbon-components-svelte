<script>
  import {
    Column,
    ContainedList,
    ContainedListItem,
    Content,
    Header,
    HeaderNav,
    HeaderNavItem,
    PageHeader,
    Row,
    Tab,
    TabContent,
    Tabs,
  } from "carbon-components-svelte";

  const events = Array.from({ length: 24 }, (_, index) => ({
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
    stickyOffset="3rem"
    grid
    title="db-prod-01"
    subtitle="PostgreSQL 16 · us-south"
  >
    <svelte:fragment slot="tabs">
      <Tabs>
        <Tab label="Activity" />
        <Tab label="Settings" />
      </Tabs>
    </svelte:fragment>
    <TabContent>
      <Row>
        <Column>
          <ContainedList labelText="Recent activity" hideLabel>
            {#each events as event (event.id)}
              <ContainedListItem>{event.text}</ContainedListItem>
            {/each}
          </ContainedList>
        </Column>
      </Row>
    </TabContent>
    <TabContent>
      <Row>
        <Column>Settings</Column>
      </Row>
    </TabContent>
  </PageHeader>
</Content>
