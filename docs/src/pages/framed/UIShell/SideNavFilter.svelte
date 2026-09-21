<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    Row,
    SideNav,
    SideNavFilter,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="Carbon" platformName="Svelte" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/" text="Introduction" />
    <SideNavLink href="/quick-start" text="Quick start" />
    <SideNavLink href="/components" text="Component index" isSelected />
    <SideNavFilter />
    <SideNavMenu text="Navigation" expanded>
      <SideNavMenuItem href="/components/UIShell" text="UIShell" />
      <SideNavMenuItem href="/components/Breadcrumb" text="Breadcrumb" />
      <SideNavMenuItem href="/components/Link" text="Link" />
    </SideNavMenu>
    <SideNavMenu text="Data & lists">
      <SideNavMenuItem href="/components/DataTable" text="DataTable" />
      <SideNavMenuItem href="/components/TreeView" text="TreeView" />
      <SideNavMenuItem
        href="/components/StructuredList"
        text="StructuredList"
      />
    </SideNavMenu>
    <SideNavMenu text="Actions">
      <SideNavMenuItem href="/components/Button" text="Button" />
      <SideNavMenuItem href="/components/OverflowMenu" text="OverflowMenu" />
      <SideNavMenuItem href="/components/ContextMenu" text="ContextMenu" />
    </SideNavMenu>
    <SideNavMenu text="Forms">
      <SideNavMenuItem href="/components/DatePicker" text="DatePicker" />
      <SideNavMenuItem href="/components/NumberInput" text="NumberInput" />
      <SideNavMenuItem href="/components/TextInput" text="TextInput" />
    </SideNavMenu>
    <SideNavMenu text="Overlays">
      <SideNavMenuItem href="/components/Modal" text="Modal" />
      <SideNavMenuItem href="/components/Tooltip" text="Tooltip" />
      <SideNavMenuItem href="/components/Popover" text="Popover" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Component index</h1>
        <p>Type in the filter above to narrow down the side nav.</p>
      </Column>
    </Row>
  </Grid>
</Content>
