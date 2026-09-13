<script>
  import {
    LocalStorage,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  let selectedUser = "morgan-lee";
  let theme = "white";
  let events = [];

  $: storageKey = `theme-preference-${selectedUser}`;
</script>

<Stack gap={6}>
  <div>
    Try selecting different users and changing their theme preferences. Each
    user's preference is stored separately and persists across page reloads.
  </div>
  <LocalStorage
    key={storageKey}
    bind:value={theme}
    on:update={({ detail }) => {
      events = [...events, { event: "on:update", detail }];
    }}
  />
  <RadioButtonGroup legendText="Select user" bind:selected={selectedUser}>
    <RadioButton labelText="Morgan Lee" value="morgan-lee" />
    <RadioButton labelText="Priya Nair" value="priya-nair" />
    <RadioButton labelText="Sam Okafor" value="sam-okafor" />
  </RadioButtonGroup>
  <RadioButtonGroup legendText="Theme preference" bind:selected={theme}>
    <RadioButton labelText="White" value="white" />
    <RadioButton labelText="Gray 10" value="g10" />
    <RadioButton labelText="Gray 80" value="g80" />
    <RadioButton labelText="Gray 90" value="g90" />
    <RadioButton labelText="Gray 100" value="g100" />
  </RadioButtonGroup>
  <Stack gap={2}>
    <div>
      <strong>Current key:</strong>
      {storageKey}
    </div>
    <div>
      <strong>Current theme:</strong>
      {theme}
    </div>
  </Stack>
  <strong> Updates: </strong>
  <pre>{JSON.stringify(events, null, 2)}</pre>
</Stack>
