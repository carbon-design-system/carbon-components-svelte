<script>
  import {
    Button,
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    Modal,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
  let open = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" />
    <SideNavLink href="/resources" text="Resource list" />
    <SideNavMenu text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Modal
  bind:open
  modalHeading="Create cluster"
  primaryButtonText="Create"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <p>
    The body scroll lock is ref-counted, so opening this modal while the side
    nav overlay is also open keeps the page locked until both are closed.
  </p>
</Modal>

<Content>
  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <h1>Clusters</h1>
          <Button on:click={() => (open = true)}>Create cluster</Button>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>
