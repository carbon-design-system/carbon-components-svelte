<script>
  import {
    Button,
    ClickableTile,
    ComboBox,
    Content,
    Dropdown,
    Header,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderUtilities,
    LayoutDirection,
    MenuButton,
    MenuItem,
    MultiSelect,
    RangeSlider,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Slider,
    TreeView,
  } from "carbon-components-svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
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
  ];
  const expandedIds = ["analytics", "engine"];

  const marks = [
    { value: 0, label: "Off" },
    { value: 5, label: "Half" },
    { value: 10, label: "Full" },
  ];

  /** @type {"ltr" | "rtl"} */
  let regionDir = "ltr";
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
  <div data-testid="clickable-tile" class="field">
    <ClickableTile href="#" icon={ArrowRight}>Billing settings</ClickableTile>
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
</Content>

<style>
  .field {
    max-width: 20rem;
    margin-bottom: 1.5rem;
  }
</style>
