<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  export let rel: string | undefined = undefined;

  // Forward `rel` only when set, as a consumer writing the attribute would.
  $: relProps = rel === undefined ? {} : { rel };
</script>

<Header
  companyName="IBM"
  platformName="Cloud"
  href="https://cloud.ibm.com"
  target="_blank"
  {...relProps}
/>
<SideNav isOpen>
  <SideNavItems>
    <SideNavMenu text="Docs" expanded>
      <SideNavMenuItem
        href="https://cloud.ibm.com/docs"
        target="_blank"
        text="API reference"
        {...relProps}
      />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
