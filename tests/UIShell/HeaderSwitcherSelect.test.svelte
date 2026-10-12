<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderSwitcher
    text="Acme"
    iconDescription="Switch account"
    on:close={onClose}
  >
    <ProfileMenuItem href="#globex">Globex</ProfileMenuItem>
    <ProfileMenuItem>Initech</ProfileMenuItem>
    <ProfileMenuItem
      on:click={(e) => {
        e.preventDefault();
      }}
      >Stay open</ProfileMenuItem
    >
  </HeaderSwitcher>
</Header>
