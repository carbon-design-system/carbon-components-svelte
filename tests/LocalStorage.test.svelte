<script lang="ts">
  import { LocalStorage } from "../types";

  let storage: LocalStorage;
  let toggled = false;
  let events = [];
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
