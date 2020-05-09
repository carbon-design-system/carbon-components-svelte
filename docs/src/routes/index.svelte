<script>
  export let inline = false;

  import { onMount, afterUpdate } from "svelte";
  import { Select, SelectItem } from "carbon-components-svelte";
  import { theme } from "../store";

  onMount(() => {
    let currentTheme = localStorage.getItem("theme");

    if (currentTheme) {
      theme.set(currentTheme);
    } else {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        theme.set("g90");
      }
    }
  });

  afterUpdate(() => {
    localStorage.setItem("theme", $theme);
    document.documentElement.setAttribute("carbon-theme", $theme);
  });
</script>

<Select {inline} labelText="Theme" bind:selected={$theme}>
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>
<!-- 
<iframe width="900" height="500" src="about/" /> -->
