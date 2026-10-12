<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <ProfileMenu on:close={onClose}>
      <ProfileMenuItem href="#settings">Settings</ProfileMenuItem>
      <ProfileMenuItem>Log out</ProfileMenuItem>
      <ProfileMenuItem
        on:click={(e) => {
          e.preventDefault();
        }}
        >Stay open</ProfileMenuItem
      >
    </ProfileMenu>
  </HeaderUtilities>
</Header>

<ProfileMenuItem>Outside any menu</ProfileMenuItem>
