<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let component: "copy" | "password" | "toggle" | "header";
  export let hideTooltip = true;
  export let portalTooltip: boolean | undefined = undefined;
</script>

{#if component === "copy"}
  <CopyButton text="us-east-1" iconDescription="Copy region" {hideTooltip} />
{:else if component === "password"}
  <PasswordInput
    labelText="Password"
    showPasswordLabel="Show password"
    {hideTooltip}
    {portalTooltip}
  />
{:else if component === "toggle"}
  <ToggleButtonGroup labelText="Actions">
    <ToggleButton value="add" icon={Add} iconDescription="Add" {hideTooltip} />
  </ToggleButtonGroup>
{:else}
  <HeaderAction iconDescription="Notifications" {hideTooltip} />
{/if}
