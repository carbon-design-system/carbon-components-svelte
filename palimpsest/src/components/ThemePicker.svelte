<script>
  export let inline = false;

  import { Select, SelectItem } from 'carbon-components-svelte';
  import { theme } from '../store';

  $: {
    document.documentElement.setAttribute('carbon-theme', $theme);
  }
</script>

<Select
  {inline}
  labelText="Theme"
  selected={$theme}
  on:change={({ detail }) => {
    theme.set(detail);
  }}>
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>
