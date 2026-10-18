<script lang="ts">
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";
</script>

<ProfileMenu isOpen iconDescription="Profile">
  <ProfileMenuItem href="#settings">Settings</ProfileMenuItem>
  <ProfileMenuItem>Log out</ProfileMenuItem>
</ProfileMenu>

<HeaderSwitcher isOpen text="Workspace">
  <ProfileMenuItem>Acme Corp</ProfileMenuItem>
  <ProfileMenuItem>Globex</ProfileMenuItem>
  <ProfileMenuItem>Initech</ProfileMenuItem>
</HeaderSwitcher>
