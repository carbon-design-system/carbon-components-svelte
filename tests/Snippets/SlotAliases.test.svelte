<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
</script>

<Toggletip>
  {#snippet labelChildren()}
    <strong data-testid="toggletip-label-children">Density</strong>
  {/snippet}
  Content
</Toggletip>

<HeaderNav>
  <HeaderNavMenu text="Ignored">
    {#snippet textChildren()}
      <span data-testid="header-nav-menu-text-children">Products</span>
    {/snippet}
    <HeaderNavItem href="/a" text="A" />
  </HeaderNavMenu>
</HeaderNav>

<Modal open passiveModal modalHeading="Create database">
  {#snippet labelChildren()}
    <span data-testid="modal-label-children">Cloudant</span>
  {/snippet}
  Content
</Modal>
