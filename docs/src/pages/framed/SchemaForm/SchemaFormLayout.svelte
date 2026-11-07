<script>
  import { SchemaForm, Stack, Toggle } from "carbon-components-svelte";

  const fields = [
    {
      name: "person",
      type: "object",
      label: "Contact",
      columns: 2,
      fields: [
        { name: "first", label: "First name" },
        { name: "last", label: "Last name" },
        { name: "email", type: "email", label: "Email", span: 2 },
        { name: "city", label: "City" },
        { name: "zip", label: "ZIP code" },
      ],
    },
  ];

  let fluid = false;
</script>

<Stack gap={6}>
  <Toggle labelText="Fluid" bind:toggled={fluid} />
  {#key fluid}
    <SchemaForm {fields} {fluid} hideActions />
  {/key}
</Stack>
