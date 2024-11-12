<script>
  import { LocalStorage, Toggle } from "carbon-components-svelte";

  let toggled = false;
  let events = [];

  $: document.documentElement.setAttribute("theme", toggled ? "g100" : "white");
</script>

<LocalStorage
  key="dark-mode"
  bind:value={toggled}
  on:save={() => {
    events = [...events, { event: "on:save" }];
  }}
  on:update={({ detail }) => {
    events = [...events, { event: "on:update", detail }];
  }}
/>

<Toggle size="sm" labelText="Dark mode" bind:toggled />

<br />

<pre>{JSON.stringify(events, null, 2)}</pre>
