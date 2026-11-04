<script>
  import { CodeSnippet, SchemaForm, Stack } from "carbon-components-svelte";

  const fields = [
    { name: "team", label: "Team name", required: true },
    {
      name: "lead",
      type: "object",
      label: "Team lead",
      columns: 2,
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
      ],
    },
    {
      name: "members",
      type: "array",
      label: "Members",
      itemLabel: "Member",
      addLabel: "Add member",
      minItems: 1,
      maxItems: 5,
      items: {
        columns: 2,
        fields: [
          { name: "name", label: "Name", required: true },
          {
            name: "role",
            type: "select",
            label: "Role",
            default: "dev",
            options: [
              { value: "dev", label: "Developer" },
              { value: "design", label: "Designer" },
            ],
          },
        ],
      },
    },
    {
      name: "domains",
      type: "array",
      label: "Allowed domains",
      itemLabel: "Domain",
      addLabel: "Add domain",
      items: {
        type: "text",
        label: "Domain",
        pattern: "^[a-z0-9.-]+\\.[a-z]{2,}$",
      },
    },
  ];

  let submitted;
</script>

<Stack gap={6}>
  <SchemaForm
    {fields}
    initialValues={{ members: [{ name: "Ada" }, { name: "Grace" }] }}
    on:submit={(event) => (submitted = JSON.stringify(event.detail, null, 2))}
  />
  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
