<script lang="ts">
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  /** Which text slots to pass: the new name, the deprecated one, or both. */
  export let slots: "textChildren" | "text" | "both" = "textChildren";
</script>

<HeaderNav>
  {#if slots === "textChildren"}
    <HeaderNavMenu text="Ignored">
      <span slot="textChildren">New label</span>
      <HeaderNavItem href="/a" text="A" />
    </HeaderNavMenu>
  {:else if slots === "text"}
    <HeaderNavMenu text="Ignored">
      <span slot="text">Old label</span>
      <HeaderNavItem href="/a" text="A" />
    </HeaderNavMenu>
  {:else}
    <HeaderNavMenu text="Ignored">
      <span slot="textChildren">New label</span>
      <span slot="text">Old label</span>
      <HeaderNavItem href="/a" text="A" />
    </HeaderNavMenu>
  {/if}
</HeaderNav>
