<script>
  import { GlobalTheme } from "carbon-components-svelte";
</script>

<GlobalTheme
  render="select"
  select="{{
    themes: ['white', 'g90', 'g100'],
    labelText: 'Select a theme',
    inline: true,
  }}"
/>
