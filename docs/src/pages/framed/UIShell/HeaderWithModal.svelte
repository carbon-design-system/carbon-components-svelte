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

<Header companyName="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/" text="Link 1" />
    <HeaderNavItem href="/" text="Link 2" />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink text="Link 1" />
    <SideNavLink text="Link 2" />
    <SideNavMenu text="Menu">
      <SideNavMenuItem href="/" text="Link 1" />
      <SideNavMenuItem href="/" text="Link 2" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Modal
  bind:open
  modalHeading="Confirm action"
  primaryButtonText="Confirm"
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
          <h1>Welcome</h1>
          <Button on:click={() => (open = true)}>Open modal</Button>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>
