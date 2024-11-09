<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  let theme: CarbonTheme = "g10";
</script>

<Theme
  bind:theme
  persist
  persistKey="carbon-theme"
  on:update="{(e) => console.log(e.detail.theme)}"
  tokens="{{ 'button-primary': 'violet' }}"
  render="toggle"
  toggle="{{
    themes: ['g10', 'g90'],
    labelA: '',
    labelB: '',
  }}"
  select="{{
    themes: ['g10', 'g90'],
    labelText: '',
  }}"
/>
