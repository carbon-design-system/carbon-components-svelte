<script>
  import { Theme } from "carbon-components-svelte";
</script>

<Theme
  render="toggle"
  toggle="{{
    themes: ['g10', 'g90'],
    labelA: 'Enable dark mode',
    labelB: 'Enable dark mode',
    hideLabel: true,
    size: 'sm',
  }}"
/>
