<script lang="ts">
  import KeyValueEditor from "carbon-components-svelte/KeyValueEditor/KeyValueEditor.svelte";
</script>

<KeyValueEditor
  id="env"
  name="env"
  labelText="Variables"
  format="env"
  columns={["enabled", "secret"]}
  addMode="ghost"
  rows={[
    { key: "HOST", value: "example.com" },
    { key: "TOKEN", value: "", secret: true, stored: true },
    { key: "BAD KEY", value: "x" },
  ]}
/>
