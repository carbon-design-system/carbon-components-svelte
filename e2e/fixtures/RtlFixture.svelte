<script>
  import {
    AILabel,
    BigNumber,
    Box,
    Button,
    Card,
    CardAction,
    CardActions,
    CardBody,
    CardFooter,
    CardHeader,
    CardMedia,
    CardTitle,
    CardTitleMedia,
    ClickableTile,
    CodeSnippet,
    ComboBox,
    Content,
    Dropdown,
    Header,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderUtilities,
    Kbd,
    LayoutDirection,
    MenuButton,
    MenuItem,
    MultiSelect,
    Pagination,
    PaginationSkeleton,
    RangeSlider,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Slider,
    Tab,
    Tabs,
    TabsSkeleton,
    TabsVertical,
    TreeSelect,
    TreeView,
  } from "carbon-components-svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import OverflowMenuVertical from "carbon-icons-svelte/lib/OverflowMenuVertical.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  const places = [
    {
      id: "eu",
      text: "Europe",
      nodes: [{ id: "de", text: "Germany" }],
    },
    {
      id: "na",
      text: "North America",
      nodes: [{ id: "us", text: "United States" }],
    },
    { id: "an", text: "Antarctica" },
  ];

  const nodes = [
    { id: "ml", text: "Machine learning" },
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        {
          id: "engine",
          text: "Analytics Engine",
          nodes: [
            { id: "spark", text: "Apache Spark", icon: Document },
            { id: "hadoop", text: "Hadoop" },
          ],
        },
        { id: "query", text: "SQL Query" },
      ],
    },
    {
      id: "storage",
      text: "Storage",
      nodes: [{ id: "object-storage", text: "Object Storage" }],
    },
  ];
  const expandedIds = ["analytics", "engine"];

  const marks = [
    { value: 0, label: "Off" },
    { value: 5, label: "Half" },
    { value: 10, label: "Full" },
  ];

  /** @type {"ltr" | "rtl"} */
  let regionDir = "ltr";

  const command = "npm install --save-dev carbon-components-svelte;";
  // 18 lines, past the 15 a collapsed snippet shows, so it gets the expand
  // button. Each line ends in punctuation, which RTL text moves to the left.
  const script = `export async function deploy(region) {
  const url = \`/api/regions/\${region}/deploy\`;
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error(\`Deploy failed: \${response.status}\`);
  }
  const { id, status } = await response.json();
  console.info("Deploy started:", id);
  return { id, status };
}

export async function rollback(region, id) {
  const url = \`/api/regions/\${region}/deploys/\${id}\`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error("Rollback failed.");
  console.info("Rolled back:", id);
  return response.status;
}`;
</script>

<Header companyName="E2E" platformName="RTL">
  <div slot="skipToContent"><SkipToContent href="#main-content" /></div>
  <HeaderNav aria-label="Top navigation">
    <HeaderNavItem href="#" text="Overview" />
    <HeaderNavMenu href="#" text="Services">
      <HeaderNavItem href="#" text="Compute" />
      <HeaderNavItem href="#" text="Storage" />
    </HeaderNavMenu>
  </HeaderNav>
  <HeaderUtilities>
    <HeaderGlobalAction iconDescription="Notifications" icon={Notification} />
    <HeaderGlobalAction iconDescription="Settings" icon={Settings} />
  </HeaderUtilities>
</Header>

<SideNav ariaLabel="Side navigation" isOpen>
  <SideNavItems>
    <SideNavLink href="#" text="Dashboard" icon={Dashboard} isSelected />
    <SideNavMenu text="Settings" icon={Settings} expanded>
      <SideNavMenuItem href="#" text="Profile" />
      <SideNavMenuItem href="#" text="Billing" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content id="main-content">
  <div data-testid="slider-gaps">
    <Slider labelText="Replicas" max={10} value={2} />
    <Slider labelText="Replicas" max={10} value={2} hideRangeLabels />
    <RangeSlider labelText="Window" max={10} value={2} valueUpper={6} />
    <RangeSlider
      labelText="Window"
      max={10}
      value={2}
      valueUpper={6}
      orientation="vertical"
    />
  </div>
  <div data-testid="slider-vertical-marks">
    <Slider
      labelText="Replicas"
      max={10}
      value={2}
      {marks}
      orientation="vertical"
    />
    <RangeSlider
      labelText="Window"
      max={10}
      value={2}
      valueUpper={6}
      {marks}
      orientation="vertical"
    />
  </div>
  <div data-testid="combobox" class="field">
    <ComboBox
      labelText="Contact"
      {items}
      selectedId="1"
      invalid
      invalidText="Not supported"
    />
  </div>
  <div data-testid="dropdown" class="field">
    <Dropdown labelText="Contact" {items} selectedId="1" />
  </div>
  <div data-testid="multiselect" class="field">
    <MultiSelect labelText="Contact" {items} selectedIds={["1"]} />
  </div>
  <div data-testid="treeselect" class="field">
    <TreeSelect
      labelText="Place"
      nodes={places}
      selectionMode="checkbox"
      expandedIds={["eu"]}
    />
  </div>
  <div data-testid="clickable-tile" class="field">
    <ClickableTile href="#" icon={ArrowRight}>Billing settings</ClickableTile>
  </div>
  <div data-testid="code-snippets" class="field">
    <CodeSnippet data-testid="snippet-single" code={command} />
    <CodeSnippet data-testid="snippet-multi" type="multi" code={script} />
    <CodeSnippet
      data-testid="snippet-single-no-copy"
      code={command}
      hideCopyButton
    />
    <CodeSnippet
      data-testid="snippet-multi-no-copy"
      type="multi"
      code={script}
      hideCopyButton
      showMoreLess={false}
    />
    <CodeSnippet data-testid="snippet-inline" type="inline" code="npm ci;" />
    <CodeSnippet data-testid="snippet-skeleton" type="multi" skeleton />
  </div>
  <div data-testid="card" class="field">
    <Card clickable href="#" aria-label="Billing settings">
      <AILabel slot="decorator" />
      <CardHeader>
        <CardTitle>Billing settings</CardTitle>
      </CardHeader>
    </Card>
  </div>
  <div data-testid="card-actions" class="field">
    <Card>
      <AILabel slot="decorator" />
      <CardHeader>
        <CardTitleMedia><Document size={20} /></CardTitleMedia>
        <CardTitle>Invoices</CardTitle>
        <CardActions slot="actions">
          <CardAction>
            <Button
              kind="ghost"
              size="sm"
              icon={Settings}
              iconDescription="Settings"
            />
          </CardAction>
        </CardActions>
      </CardHeader>
      <CardBody>Three invoices are due this month.</CardBody>
      <CardFooter actionSet>
        <CardAction>
          <Button kind="ghost">View invoices</Button>
        </CardAction>
        <CardAction iconOnly>
          <Button
            kind="ghost"
            icon={OverflowMenuVertical}
            iconDescription="More"
          />
        </CardAction>
      </CardFooter>
    </Card>
  </div>
  <div data-testid="card-media" class="field">
    <Card clickable href="#" aria-label="Usage">
      <CardMedia slot="media" ratio="2x1"><div></div></CardMedia>
      <AILabel slot="decorator" />
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
    </Card>
  </div>
  <div data-testid="card-media-end" class="field">
    <Card horizontal mediaPosition="end">
      <CardMedia slot="media" mediaWidth="40%"><div></div></CardMedia>
      <AILabel slot="decorator" />
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardBody>Three invoices are due this month.</CardBody>
    </Card>
  </div>
  <div data-testid="menu-button" class="field">
    <MenuButton labelText="Actions">
      <MenuItem labelText="Copy" />
      <MenuItem labelText="Export as">
        <MenuItem labelText="PDF" />
        <MenuItem labelText="PNG" />
      </MenuItem>
    </MenuButton>
  </div>
  <div data-testid="tree" class="field">
    <TreeView labelText="Services" {nodes} {expandedIds} activeId="hadoop" />
  </div>
  <div data-testid="tree-multiselect" class="field">
    <TreeView
      labelText="Services"
      multiselect
      {nodes}
      {expandedIds}
      selectedIds={["spark", "query"]}
    />
  </div>
  <div data-testid="tree-checkbox" class="field">
    <TreeView
      labelText="Services"
      selectionMode="checkbox"
      {nodes}
      {expandedIds}
      checkedIds={["spark"]}
    />
  </div>
  <div data-testid="tree-virtual" class="field">
    <TreeView
      labelText="Services"
      virtualize
      {nodes}
      {expandedIds}
      activeId="hadoop"
    />
  </div>
  <Slider data-testid="slider" labelText="Replicas" max={10} value={2} marks />
  <RangeSlider
    data-testid="range-slider"
    labelText="Window"
    max={10}
    value={2}
    valueUpper={6}
    {marks}
  />
  <div data-testid="pagination">
    <Pagination totalItems={103} pageSizes={[10, 20, 50]} />
    <Pagination totalItems={103} pageInputType="input" />
    <PaginationSkeleton />
  </div>
  <Button
    size="small"
    on:click={() => (regionDir = regionDir === "ltr" ? "rtl" : "ltr")}
    >Flip region</Button
  >
  <LayoutDirection dir={regionDir} data-testid="region">
    <Slider
      data-testid="region-slider"
      labelText="Region replicas"
      max={10}
      value={2}
      marks
    />
    <RangeSlider
      data-testid="region-range-slider"
      labelText="Region window"
      max={10}
      value={2}
      valueUpper={6}
      {marks}
    />
  </LayoutDirection>
  <div data-testid="big-numbers">
    <BigNumber
      labelText="Cost change"
      locale="en-US"
      value={-1200}
      total={2000}
      delta={12}
      deltaPercentage
    />
    <BigNumber
      labelText="Uptime"
      locale="ar-EG"
      value={12}
      percentage
      delta={12}
      deltaPercentage
    />
    <BigNumber labelText="Requests" locale="ar" value={2} delta={-1200000} />
  </div>
  <Box data-testid="box-logical" paddingX={1} paddingStart={5} marginEnd={3}
    >Logical sides</Box
  >
  <Box data-testid="box-logical-custom" marginX="2px" marginStart="20px"
    >Custom logical sides</Box
  >
  <div data-testid="tabs-vertical">
    <TabsVertical orientation="vertical">
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Settings" disabled />
    </TabsVertical>
  </div>
  <div data-testid="tabs-vertical-row">
    <TabsVertical orientation="horizontal">
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Settings" />
    </TabsVertical>
  </div>
  <div data-testid="tabs-container">
    <Tabs type="container">
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Metrics" />
      <Tab label="Settings" disabled />
    </Tabs>
  </div>
  <div data-testid="tabs-container-skeleton">
    <TabsSkeleton type="container" count={3} />
  </div>
  <div data-testid="tabs-default">
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Metrics" />
      <Tab label="Settings" disabled />
    </Tabs>
  </div>
  <div data-testid="tabs-default-skeleton">
    <TabsSkeleton count={3} />
  </div>
  <div data-testid="kbd">
    <Kbd shortcut="mod+shift+k" />
  </div>
</Content>

<style>
  .field {
    max-width: 20rem;
    margin-bottom: 1.5rem;
  }
</style>
