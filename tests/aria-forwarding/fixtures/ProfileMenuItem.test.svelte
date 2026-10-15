<script lang="ts">
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let href: string | undefined = undefined;
</script>

<ProfileMenu isOpen>
  <ProfileMenuItem {href} {...$$restProps}>Settings</ProfileMenuItem>
</ProfileMenu>
