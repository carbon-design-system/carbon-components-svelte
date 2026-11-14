<script lang="ts">
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import Logout from "carbon-icons-svelte/lib/Logout.svelte";
</script>

<ProfileMenuItem data-testid="with-icon" icon={Logout} on:click>
  Log out
</ProfileMenuItem>

<ProfileMenuItem data-testid="no-icon" href="/settings"
  >Settings</ProfileMenuItem
>

<ProfileMenuItem data-testid="with-avatar">
  <svelte:fragment slot="avatar">
    <UserAvatar name="Acme Corp" size="sm" />
  </svelte:fragment>
  Acme Corp
</ProfileMenuItem>
