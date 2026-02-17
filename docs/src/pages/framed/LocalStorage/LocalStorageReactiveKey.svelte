<script>
  import {
    LocalStorage,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  let selectedUser = "user-1";
  let theme = "white";

  $: storageKey = `local-storage-reactive-example-${selectedUser}`;
</script>

<Stack gap={2}>
  <div>
    Try selecting different users and changing their theme preferences. Each
    user's preference is stored separately and persists across page reloads.
  </div>
  <LocalStorage key={storageKey} bind:value={theme} />
  <RadioButtonGroup legendText="Select user" bind:selected={selectedUser}>
    <RadioButton labelText="User 1" value="user-1" />
    <RadioButton labelText="User 2" value="user-2" />
    <RadioButton labelText="User 3" value="user-3" />
  </RadioButtonGroup>
  <RadioButtonGroup legendText="Theme preference" bind:selected={theme}>
    <RadioButton labelText="White" value="white" />
    <RadioButton labelText="Gray 10" value="g10" />
    <RadioButton labelText="Gray 80" value="g80" />
    <RadioButton labelText="Gray 90" value="g90" />
    <RadioButton labelText="Gray 100" value="g100" />
  </RadioButtonGroup>
  <div>
    <div>
      <strong>Current key:</strong>
      {storageKey}
    </div>
    <div>
      <strong>Current theme:</strong>
      {theme}
    </div>
  </div>
</Stack>
