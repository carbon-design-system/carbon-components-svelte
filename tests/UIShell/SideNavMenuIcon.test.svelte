<script lang="ts">
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
</script>

<SideNavMenu text="Prop icon" icon={Home} />
<SideNavMenu text="Slot icon">
  <Home slot="icon" />
</SideNavMenu>
<SideNavMenu text="No icon" />
