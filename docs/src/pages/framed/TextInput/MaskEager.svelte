<script>
  import { mask, Stack, TextInput } from "carbon-components-svelte";

  let lazy = "";
  let eager = "";
</script>

<Stack gap={6}>
  <div use:mask={{ pattern: "99/99/9999" }}>
    <TextInput
      labelText="Lazy: a literal appears when the next digit needs it"
      helperText="Format: DD/MM/YYYY"
      bind:value={lazy}
    />
  </div>
  <div use:mask={{ pattern: "99/99/9999", eager: true }}>
    <TextInput
      labelText="Eager: a literal appears as soon as a group is full"
      helperText="Format: DD/MM/YYYY"
      bind:value={eager}
    />
  </div>
</Stack>
