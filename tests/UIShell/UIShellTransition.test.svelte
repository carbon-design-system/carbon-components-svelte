<script lang="ts">
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: "action" | "switcher" | "profile";
  export let isOpen = false;
  export let transition: ComponentProps<HeaderAction>["transition"] = undefined;
</script>

{#if kind === "action"}
  <HeaderAction bind:isOpen {transition} iconDescription="Menu">
    <p data-testid="panel">Panel</p>
  </HeaderAction>
{:else if kind === "switcher"}
  <HeaderSwitcher bind:isOpen {transition}>
    <p data-testid="panel">Panel</p>
  </HeaderSwitcher>
{:else}
  <ProfileMenu bind:isOpen {transition}>
    <p data-testid="panel">Panel</p>
  </ProfileMenu>
{/if}
