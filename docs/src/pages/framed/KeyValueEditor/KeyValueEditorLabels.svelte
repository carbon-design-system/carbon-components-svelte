<script>
  import { KeyValueEditor } from "carbon-components-svelte";

  // Kubernetes label rules: an optional DNS prefix and a name of up to 63
  // characters, and a value of up to 63 characters.
  const NAME =
    /^([a-z0-9]([-a-z0-9.]*[a-z0-9])?\/)?[A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?$/;
  const VALUE = /^([A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?)?$/;

  let rows = [
    { key: "app.kubernetes.io/name", value: "checkout" },
    { key: "tier", value: "backend" },
    { key: "team", value: "payments" },
  ];

  function validate(row) {
    return {
      key:
        row.key && !NAME.test(row.key)
          ? "Use a name of up to 63 letters, numbers, dashes, dots or underscores."
          : undefined,
      value: VALUE.test(row.value)
        ? undefined
        : "Use up to 63 letters, numbers, dashes, dots or underscores.",
    };
  }
</script>

<KeyValueEditor
  bind:rows
  format="plain"
  labelText="Labels"
  helperText="Up to 10 labels."
  maxRows={10}
  keyPattern={null}
  {validate}
  bulkEdit={false}
  addText="Add label"
/>
