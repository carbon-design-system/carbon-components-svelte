<script lang="ts">
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
</script>

<SideNavMenu text="Level 1" icon={Home}>
  <SideNavMenu text="Level 2">
    <SideNavMenu text="Level 3">
      <Home slot="icon" />
    </SideNavMenu>
  </SideNavMenu>
</SideNavMenu>
