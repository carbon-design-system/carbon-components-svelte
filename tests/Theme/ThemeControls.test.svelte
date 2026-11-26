<script lang="ts">
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import ThemeDropdown from "carbon-components-svelte/Theme/ThemeDropdown.svelte";
  import ThemeSelect from "carbon-components-svelte/Theme/ThemeSelect.svelte";
  import ThemeToggle from "carbon-components-svelte/Theme/ThemeToggle.svelte";

  export let control: "toggle" | "select" | "dropdown" = "toggle";

  let theme: "white" | "g10" | "g80" | "g90" | "g100" = "white";
</script>

<Theme bind:theme />
{#if control === "toggle"}
  <ThemeToggle bind:theme />
{:else if control === "select"}
  <ThemeSelect bind:theme themes={["white", "g90", "g100"]} />
{:else}
  <ThemeDropdown bind:theme />
{/if}
