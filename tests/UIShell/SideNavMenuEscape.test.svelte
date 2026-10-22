<svelte:options accessors />

<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  export let isOpen = true;
</script>

<SideNav bind:isOpen>
  <SideNavItems>
    <SideNavMenu text="Billing">
      <SideNavMenuItem href="#invoices" text="Invoices" />
      <SideNavMenu text="Payment methods">
        <SideNavMenuItem href="#cards" text="Cards" />
      </SideNavMenu>
    </SideNavMenu>
  </SideNavItems>
</SideNav>
