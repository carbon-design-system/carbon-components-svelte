<script>
  import { PeoplePicker, Stack } from "carbon-components-svelte";

  const watchers = Array.from({ length: 50 }, (_, i) => ({
    id: `u-${i}`,
    name: `Watcher ${i + 1}`,
    email: `watcher${i + 1}@example.com`,
  }));

  let value = watchers;
</script>

<Stack gap={5}>
  <PeoplePicker
    bind:value
    items={watchers}
    maxVisible={5}
    labelText="Watchers"
    helperText="Focus the field to show all 50"
  />
  <PeoplePicker
    value={watchers}
    items={watchers}
    maxVisible={0}
    readonly
    labelText="Every watcher, always shown"
  />
</Stack>
