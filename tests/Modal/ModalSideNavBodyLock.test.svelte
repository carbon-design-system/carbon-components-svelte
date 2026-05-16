<svelte:options accessors />

<script lang="ts">
  import {
    Modal,
    SideNav,
    SideNavItems,
    SideNavLink,
  } from "carbon-components-svelte";

  export let modalOpen = false;
  export let sideNavOpen = false;
</script>

<Modal bind:open={modalOpen} modalHeading="Heading" passiveModal />

<SideNav bind:isOpen={sideNavOpen} ariaLabel="Nav">
  <SideNavItems>
    <SideNavLink href="#" text="Link" />
  </SideNavItems>
</SideNav>
