<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem
      href="https://example.com/docs"
      target="_blank"
      text="Docs"
      icon={Launch}
    />
    <HeaderNavItem
      href="https://example.com/status"
      target="_blank"
      text="Status"
    >
      <span slot="icon" data-testid="slot-icon" aria-hidden="true">↗</span>
    </HeaderNavItem>
  </HeaderNav>
</Header>
