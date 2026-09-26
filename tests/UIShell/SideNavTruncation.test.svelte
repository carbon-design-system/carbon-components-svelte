<script lang="ts">
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  export let text = "A very long label that should be truncated";
  export let title: string | undefined = undefined;
</script>

<ul>
  <li data-testid="link">
    <SideNavLink {text} {title} />
  </li>
  <li data-testid="menu-item">
    <SideNavMenuItem {text} {title} />
  </li>
  <li data-testid="menu">
    <SideNavMenu {text} {title} />
  </li>
</ul>
