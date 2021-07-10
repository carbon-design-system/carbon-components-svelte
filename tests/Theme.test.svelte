<script lang="ts">
  import { Theme } from "../types";
  import { CarbonTheme } from "../types/Theme/Theme";

  let theme: CarbonTheme = "g10";
</script>

<Theme
  bind:theme
  persist
  persistKey="carbon-theme"
  on:update="{(e) => console.log(e.detail.theme)}"
  tokens="{{ 'button-primary': 'violet' }}"
  render="toggle"
  renderToggle="{{
    themes: ['g10', 'g90'],
    labelA: '',
    labelB: '',
    hideLabel: true,
  }}"
/>
