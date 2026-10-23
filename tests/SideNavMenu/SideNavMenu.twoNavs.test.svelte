<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
</script>

<SideNav ariaLabel="Workspace" isOpen>
  <SideNavItems>
    <SideNavMenu expanded text="Billing">
      <SideNavMenuItem href="/invoices" text="Invoices" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
<SideNav ariaLabel="Admin" rail>
  <SideNavItems>
    <SideNavMenu expanded text="Access">
      <SideNavMenuItem href="/roles" text="Roles" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
