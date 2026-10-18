<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let variant: "action" | "profile" | "switcher" = "action";
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let maxWidth: string | number = "10rem";
  export let preventCloseOnClickOutside = false;

  const keepOpen = (e: MouseEvent) => {
    e.preventDefault();
  };
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    {#if variant === "action"}
      <HeaderAction
        transition={false}
        iconDescription="Switcher"
        on:open={onOpen}
        on:close={onClose}
      >
        <HeaderPanelLinks>
          <HeaderPanelLink href="#anchor">Anchor</HeaderPanelLink>
          <HeaderPanelLink>Button</HeaderPanelLink>
          <HeaderPanelLink on:click={keepOpen}>Stay open</HeaderPanelLink>
        </HeaderPanelLinks>
      </HeaderAction>
    {:else if variant === "profile"}
      <ProfileMenu on:open={onOpen} on:close={onClose}>
        <ProfileMenuItem href="#anchor">Anchor</ProfileMenuItem>
        <ProfileMenuItem>Button</ProfileMenuItem>
        <ProfileMenuItem on:click={keepOpen}>Stay open</ProfileMenuItem>
      </ProfileMenu>
    {:else}
      <HeaderSwitcher
        text="Acme"
        iconDescription="Switch account"
        {maxWidth}
        {preventCloseOnClickOutside}
        on:open={onOpen}
        on:close={onClose}
      >
        <ProfileMenuItem href="#anchor">Anchor</ProfileMenuItem>
        <ProfileMenuItem>Button</ProfileMenuItem>
        <ProfileMenuItem on:click={keepOpen}>Stay open</ProfileMenuItem>
      </HeaderSwitcher>
    {/if}
  </HeaderUtilities>
</Header>

{#if variant === "action"}
  <HeaderPanelLink>Outside</HeaderPanelLink>
{:else if variant === "profile"}
  <ProfileMenuItem>Outside</ProfileMenuItem>
{/if}
