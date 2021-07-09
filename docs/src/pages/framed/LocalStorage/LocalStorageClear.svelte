<script>
  import { LocalStorage, Toggle, Button } from "carbon-components-svelte";

  let storage;
  let toggled = false;
  let events = [];

  $: document.documentElement.setAttribute("theme", toggled ? "g100" : "white");
</script>

<LocalStorage
  bind:this="{storage}"
  key="dark-mode"
  bind:value="{toggled}"
  on:save="{() => {
    events = [...events, { event: 'on:save' }];
  }}"
  on:update="{({ detail }) => {
    events = [...events, { event: 'on:update', detail }];
  }}"
/>

<Toggle size="sm" labelText="Dark mode" bind:toggled />

<br />
<br />

<Button
  size="small"
  on:click="{() => {
    events = [];
    storage.clearAll();
  }}"
>
  Clear local storage
</Button>

<br />
<br />

<pre>
    {JSON.stringify(events, null, 2)}
  </pre>
