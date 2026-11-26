<script>
  import { Button, Text, Theme, ThemeToggle } from "carbon-components-svelte";

  let theme = "white";
</script>

<Theme system bind:theme />
<ThemeToggle bind:theme />

<Text>Current theme: {theme}</Text>

<Button kind="tertiary" on:click={() => (theme = "g10")}>
  Switch to Gray 10
</Button>
