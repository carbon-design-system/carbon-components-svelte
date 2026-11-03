<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let expanded = false;
  export let transition: ComponentProps<SideNavMenu>["transition"] = undefined;
  export let motionCollapse: MotionValue = undefined;
</script>

<Motion collapse={motionCollapse}>
  <SideNav isOpen>
    <SideNavItems>
      <SideNavMenu text="Menu" bind:expanded {transition}>
        <SideNavMenuItem href="/a" text="Link A" />
        <SideNavMenuItem href="/b" text="Link B" />
      </SideNavMenu>
    </SideNavItems>
  </SideNav>
</Motion>
