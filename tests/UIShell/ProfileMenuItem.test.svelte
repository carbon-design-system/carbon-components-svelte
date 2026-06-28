<script lang="ts">
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";
  import Logout from "carbon-icons-svelte/lib/Logout.svelte";
</script>

<ProfileMenuItem data-testid="with-icon" icon={Logout} on:click>
  Log out
</ProfileMenuItem>

<ProfileMenuItem data-testid="no-icon" href="/settings"
  >Settings</ProfileMenuItem
>
