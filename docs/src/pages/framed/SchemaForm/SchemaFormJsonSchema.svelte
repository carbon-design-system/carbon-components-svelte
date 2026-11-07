<script>
  import { CodeSnippet, SchemaForm, Stack } from "carbon-components-svelte";

  const schema = {
    $defs: {
      address: {
        type: "object",
        required: ["city"],
        properties: {
          city: { type: "string", title: "City", minLength: 2 },
          zip: { type: "string", title: "ZIP code", pattern: "^\\d{5}$" },
        },
      },
    },
    type: "object",
    required: ["email", "plan", "terms"],
    properties: {
      email: { type: "string", format: "email", title: "Email" },
      age: { type: "integer", title: "Age", minimum: 18, maximum: 99 },
      plan: {
        title: "Plan",
        type: "string",
        oneOf: [
          { const: "free", title: "Free" },
          { const: "pro", title: "Pro" },
        ],
      },
      roles: {
        type: "array",
        title: "Roles",
        uniqueItems: true,
        items: { enum: ["admin", "developer", "viewer"] },
      },
      bio: { type: "string", title: "Bio", maxLength: 280 },
      home: { $ref: "#/$defs/address", title: "Home address" },
      terms: { type: "boolean", const: true, title: "I accept the terms" },
    },
  };

  const uiSchema = {
    bio: { "ui:widget": "textarea", "ui:help": "Up to 280 characters" },
    plan: { "ui:widget": "radio" },
    "ui:order": ["email", "plan", "age", "roles", "bio", "*"],
  };

  let submitted;
</script>

<Stack gap={6}>
  <SchemaForm
    {schema}
    {uiSchema}
    on:submit={(event) => (submitted = JSON.stringify(event.detail, null, 2))}
  />
  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
