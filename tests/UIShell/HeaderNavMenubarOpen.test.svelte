<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let onClose: (menu: string, trigger: string) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/1" text="Link 1" />
    <HeaderNavMenu
      text="Menu A"
      on:close={(e) => onClose("A", e.detail.trigger)}
    >
      <HeaderNavItem href="/a1" text="A1" />
      <HeaderNavItem href="/a2" text="A2" />
    </HeaderNavMenu>
    <HeaderNavMenu
      text="Menu B"
      on:close={(e) => onClose("B", e.detail.trigger)}
    >
      <HeaderNavItem href="/b1" text="B1" />
      <HeaderNavItem href="/b2" text="B2" />
    </HeaderNavMenu>
    <HeaderNavItem href="/2" text="Link 2" />
  </HeaderNav>
</Header>
