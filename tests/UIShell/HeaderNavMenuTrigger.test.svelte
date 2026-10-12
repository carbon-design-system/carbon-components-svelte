<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavMenu text="Plain">
      <HeaderNavItem href="/a" text="A" />
    </HeaderNavMenu>
    <HeaderNavMenu text="With icon" icon={Launch}>
      <HeaderNavItem href="/b" text="B" />
    </HeaderNavMenu>
    <HeaderNavMenu text="Ignored">
      <span slot="text" data-testid="custom-text">Custom label</span>
      <span slot="icon" data-testid="slot-icon" aria-hidden="true">+</span>
      <HeaderNavItem href="/c" text="C" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>
