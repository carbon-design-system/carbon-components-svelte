<script lang="ts">
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";
  import ProfileMenuList from "carbon-components-svelte/UIShell/ProfileMenuList.svelte";
</script>

<ProfileMenuList data-testid="list">
  <ProfileMenuItem href="/settings">Settings</ProfileMenuItem>
  <ProfileMenuItem href="/privacy">Privacy</ProfileMenuItem>
</ProfileMenuList>
