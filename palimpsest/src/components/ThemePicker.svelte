<script>
  import { Select, SelectItem } from 'carbon-components-svelte';
  import { theme } from '../store';

  let selected = 'g10';

  $: {
    theme.set(selected);
    document.documentElement.setAttribute('carbon-theme', selected);
  }
</script>

<Select inline labelText="Theme" bind:selected>
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>
