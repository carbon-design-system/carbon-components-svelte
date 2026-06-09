<svelte:options accessors />

<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";

  export let modalOpen = false;
  export let sideNavOpen = false;
</script>

<Modal bind:open={modalOpen} modalHeading="Heading" passiveModal />

<SideNav bind:isOpen={sideNavOpen} ariaLabel="Nav">
  <SideNavItems>
    <SideNavLink href="#" text="Link" />
  </SideNavItems>
</SideNav>
