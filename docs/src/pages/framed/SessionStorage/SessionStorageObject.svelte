<script>
  import {
    Button,
    SessionStorage,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  // A nested object value. Editing a nested field — either through a two-way
  // binding or an explicit in-place mutation signalled with `value = value` —
  // is persisted because the component compares the serialized form.
  let settings = { profile: { name: "Ada", role: "Engineer" }, visits: 0 };
  let events = [];
</script>

<Stack gap={6}>
  <SessionStorage
    key="session-storage-object-example"
    bind:value={settings}
    on:update={({ detail }) => {
      events = [...events, { event: "on:update", detail }];
    }}
  />

  <div>
    Edit the nested fields below, then refresh the page to confirm the changes
    survive within the session. The two-way bindings mutate
    <code>settings</code>
    in place; the component still persists them.
  </div>

  <TextInput
    labelText="Name (binds to settings.profile.name)"
    bind:value={settings.profile.name}
  />

  <TextInput
    labelText="Role (binds to settings.profile.role)"
    bind:value={settings.profile.role}
  />

  <Button
    size="small"
    on:click={() => {
      settings.visits += 1; // in-place mutation
      settings = settings; // signal the change to Svelte
    }}
  >
    Increment visits ({settings.visits})
  </Button>

  <div>
    <strong>Current value:</strong>
    <pre>{JSON.stringify(settings, null, 2)}</pre>
  </div>

  <div>
    <strong>Updates (note prevValue is a true snapshot):</strong>
    <pre>{JSON.stringify(events, null, 2)}</pre>
  </div>
</Stack>
