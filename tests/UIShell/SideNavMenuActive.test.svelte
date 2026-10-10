<script lang="ts">
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  export let selected: "current" | "other" | undefined = undefined;

  let rendered = true;
</script>

<SideNavMenu text="Level 1">
  <SideNavMenu text="Level 2">
    <SideNavMenu text="Level 3">
      {#if rendered}
        <SideNavMenuItem
          href="/current"
          text="Current"
          isSelected={selected === "current"}
        />
      {/if}
    </SideNavMenu>
  </SideNavMenu>
  <SideNavMenu text="Sibling">
    <SideNavLink href="/other" text="Other" isSelected={selected === "other"} />
  </SideNavMenu>
</SideNavMenu>
<SideNavMenu text="Detail" isActive>
  <SideNavMenuItem href="/detail" text="Listed" />
</SideNavMenu>

<button type="button" on:click={() => (selected = "current")}>
  Select current
</button>
<button type="button" on:click={() => (selected = "other")}>
  Select other
</button>
<button type="button" on:click={() => (rendered = !rendered)}>
  Toggle current
</button>
