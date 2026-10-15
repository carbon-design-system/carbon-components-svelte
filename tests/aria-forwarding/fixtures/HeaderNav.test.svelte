<script lang="ts">
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  /** Which component gets the rest props. */
  export let under: "nav" | "item" | "menu" = "nav";
</script>

<HeaderNav {...under === "nav" ? $$restProps : {}}>
  <HeaderNavItem
    href="/"
    text="Home"
    {...under === "item" ? $$restProps : {}}
  />
  <HeaderNavMenu text="More" {...under === "menu" ? $$restProps : {}}>
    <HeaderNavItem href="/a" text="A" />
  </HeaderNavMenu>
</HeaderNav>
