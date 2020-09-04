<script>
  import { onMount } from "svelte";
  import { Select, SelectItem } from "carbon-components-svelte";

  let theme = undefined;

  onMount(() => {
    theme = localStorage.getItem("theme") || "g10";
  });

  $: if (theme) {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("carbon-theme", theme);
  }
</script>

<style>
  :global(.bx--select-input) {
    width: auto;
    min-width: 0;
  }
</style>

<Select inline labelText="Theme" bind:selected="{theme}">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>
