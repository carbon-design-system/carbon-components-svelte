<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderUtilities>
    <HeaderAction iconDescription="Notifications">
      <p>Notifications panel</p>
    </HeaderAction>
    <HeaderAction iconDescription="Help">
      <p>Help panel</p>
    </HeaderAction>
    <HeaderSwitcher text="Acme Corp" iconDescription="Switch account" />
    <ProfileMenu iconDescription="Profile" />
  </HeaderUtilities>
</Header>
