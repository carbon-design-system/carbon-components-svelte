<script>
  import { LocalStorage, Toggle, Button } from "carbon-components-svelte";

  let storage;
  let toggled = false;

  $: document.documentElement.setAttribute("data-carbon-theme", toggled ? "g100" : "white");
</script>

<LocalStorage bind:this="{storage}" bind:value="{toggled}" />

<Toggle size="sm" labelText="Dark mode" bind:toggled />

<br />
<br />

<Button size="small" on:click="{storage.clearAll}">Clear storage</Button>
