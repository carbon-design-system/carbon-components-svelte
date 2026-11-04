<script>
  import "carbon-components-svelte/css/prose.css";
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";
  import SkeletonText from "carbon-components-svelte/SkeletonText/SkeletonText.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
  import Content from "carbon-components-svelte/UIShell/Content.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";

  const headers = [
    { key: "service", value: "Service" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
  ];

  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: `row-${i}`,
    service: `payments-api-${i}`,
    region: "us-east-1",
    status: "Healthy",
  }));
</script>

<Header companyName="Carbon" platformName="Print" data-testid="header">
  <svelte:fragment slot="skipToContent">
    <SkipToContent href="#main-content" data-testid="skip" />
  </svelte:fragment>
</Header>

<SideNav isOpen ariaLabel="Side navigation" data-testid="side-nav">
  <SideNavItems>
    <SideNavLink href="#" text="Overview" />
    <SideNavLink href="#" text="Services" />
  </SideNavItems>
</SideNav>

<Content>
  <h1>Service report</h1>

  <div data-testid="table">
    <DataTable
      stickyHeader
      stickyHeaderMaxHeight={240}
      title="Services"
      {headers}
      {rows}
    >
      <Toolbar data-testid="toolbar">
        <ToolbarContent>
          <Button>Create service</Button>
        </ToolbarContent>
      </Toolbar>
    </DataTable>
    <Pagination totalItems={rows.length} pageSizes={[10, 20]} />
  </div>

  <Accordion>
    <AccordionItem title="Closed section">
      <p data-testid="accordion-content">Content of a closed section</p>
    </AccordionItem>
    <AccordionItem title="Open section" open>
      <p>Content of an open section</p>
    </AccordionItem>
  </Accordion>

  <Tile data-testid="tile">A tile with a summary of the report</Tile>

  <InlineNotification
    lowContrast
    kind="info"
    title="Heads up"
    subtitle="This notification stays whole."
  />

  <SkeletonText data-testid="skeleton" paragraph lines={3} />

  <Prose data-testid="prose">
    <h2>Release notes</h2>
    <p>
      Read the
      <a data-testid="external-link" href="https://carbon.example.com/docs">
        docs
      </a>.
    </p>
    <pre
      data-testid="code">const report = await fetch("/api/report").then((response) => response.json());</pre>
  </Prose>
</Content>

<Modal open passiveModal modalHeading="Open modal" data-testid="modal">
  <p>The modal is open on screen.</p>
</Modal>
