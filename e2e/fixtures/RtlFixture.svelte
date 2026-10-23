<script>
  import {
    ComboBox,
    Content,
    Dropdown,
    Header,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderUtilities,
    MenuButton,
    MenuItem,
    MultiSelect,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
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
  <div data-testid="menu-button" class="field">
    <MenuButton labelText="Actions">
      <MenuItem labelText="Copy" />
      <MenuItem labelText="Export as">
        <MenuItem labelText="PDF" />
        <MenuItem labelText="PNG" />
      </MenuItem>
    </MenuButton>
  </div>
</Content>

<style>
  .field {
    max-width: 20rem;
    margin-bottom: 1.5rem;
  }
</style>
