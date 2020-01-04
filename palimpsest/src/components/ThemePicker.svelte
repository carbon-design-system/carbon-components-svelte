<script>
  import { Select, SelectItem } from 'carbon-components-svelte';

  let selected = 'white';

  $: {
    document.documentElement.setAttribute('carbon-theme', selected);
  }
</script>

<Select inline labelText="Select Carbon Theme" bind:selected>
  <SelectItem value="white" text="White (light)" />
  <SelectItem value="g10" text="Gray 10 (light)" />
  <SelectItem value="g90" text="Gray 90 (dark)" />
  <SelectItem value="g100" text="Gray 100 (dark)" />
</Select>
