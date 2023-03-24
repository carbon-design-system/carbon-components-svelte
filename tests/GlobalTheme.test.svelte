<script lang="ts">
  import { GlobalTheme } from "../types";
  import type { CarbonTheme } from "../types/GlobalTheme/GlobalTheme.svelte";

  let theme: CarbonTheme = "g10";
</script>

<GlobalTheme
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
