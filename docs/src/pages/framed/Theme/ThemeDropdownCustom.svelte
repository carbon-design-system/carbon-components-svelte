<script>
  import { Theme } from "carbon-components-svelte";
</script>

<Theme
  render="dropdown"
  dropdown={{
    themes: ["white", "g90", "g100"],
    labelText: "Select a theme",
    type: "inline",
  }}
/>
