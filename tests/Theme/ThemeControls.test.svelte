<svelte:options accessors />

<script lang="ts">
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import ThemeDropdown from "carbon-components-svelte/Theme/ThemeDropdown.svelte";
  import ThemeSelect from "carbon-components-svelte/Theme/ThemeSelect.svelte";
  import ThemeToggle from "carbon-components-svelte/Theme/ThemeToggle.svelte";

  export let control: "toggle" | "select" | "dropdown" = "toggle";
  export let controlProps: Record<string, unknown> = {};
  export let theme: "white" | "g10" | "g80" | "g90" | "g100" = "white";
  export let onUpdate: ((detail: { theme: string }) => void) | undefined =
    undefined;
</script>

<Theme bind:theme on:update={(e) => onUpdate?.(e.detail)} />
{#if control === "toggle"}
  <ThemeToggle {...controlProps} bind:theme />
{:else if control === "select"}
  <ThemeSelect {...controlProps} bind:theme />
{:else}
  <ThemeDropdown {...controlProps} bind:theme />
{/if}
