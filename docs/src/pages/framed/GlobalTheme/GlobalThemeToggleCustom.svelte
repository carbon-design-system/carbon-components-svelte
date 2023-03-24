<script>
  import { GlobalTheme } from "carbon-components-svelte";
</script>

<GlobalTheme
  render="toggle"
  toggle="{{
    themes: ['g10', 'g80'],
    labelA: 'Enable dark mode',
    labelB: 'Enable dark mode',
    hideLabel: true,
    size: 'sm',
  }}"
/>
