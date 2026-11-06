<script lang="ts">
  import WebTerminal from "carbon-components-svelte/WebTerminal/WebTerminal.svelte";

  export let theme: "g100" | "white" | "system" = "g100";
</script>

<WebTerminal
  {theme}
  title="Shell"
  labelText="Shell output"
  complete={() => []}
/>
