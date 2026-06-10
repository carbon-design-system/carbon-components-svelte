<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuDetail from "carbon-components-svelte/UIShell/ProfileMenuDetail.svelte";
  import ProfileMenuDivider from "carbon-components-svelte/UIShell/ProfileMenuDivider.svelte";
  import ProfileMenuHeader from "carbon-components-svelte/UIShell/ProfileMenuHeader.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let isOpen = false;
  export let preventCloseOnClickOutside = false;

  let logoutClicks = 0;
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <ProfileMenu bind:isOpen {preventCloseOnClickOutside} transition={false}>
      <ProfileMenuHeader
        name="Richard Hendricks"
        username="rhendricks"
        href="/profile"
      />
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Plan">
        Lite
        <a slot="action" href="/upgrade">Upgrade</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuItem href="/settings">Settings</ProfileMenuItem>
      <ProfileMenuItem on:click={() => (logoutClicks += 1)}
        >Log out</ProfileMenuItem
      >
      <span data-testid="logout-count">{logoutClicks}</span>
    </ProfileMenu>
  </HeaderUtilities>
</Header>
