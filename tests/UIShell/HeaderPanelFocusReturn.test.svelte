<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let profileOpen = false;
  export let switcherOpen = false;
  export let actionOpen = false;
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <HeaderSwitcher bind:isOpen={switcherOpen} transition={false}>
      <ProfileMenuItem on:click={() => (switcherOpen = false)}>
        Globex
      </ProfileMenuItem>
    </HeaderSwitcher>
    <HeaderAction
      bind:isOpen={actionOpen}
      transition={false}
      iconDescription="Notifications"
    >
      <button type="button" on:click={() => (actionOpen = false)}>
        Dismiss all
      </button>
    </HeaderAction>
    <ProfileMenu bind:isOpen={profileOpen} transition={false}>
      <ProfileMenuItem on:click={() => (profileOpen = false)}>
        Log out
      </ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
</Header>

<p>Not focusable</p>
