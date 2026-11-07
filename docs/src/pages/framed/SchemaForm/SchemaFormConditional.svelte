<script>
  import {
    CodeSnippet,
    RadioButton,
    RadioButtonGroup,
    SchemaForm,
    Stack,
  } from "carbon-components-svelte";

  const fields = [
    {
      name: "contact",
      type: "radio",
      label: "Contact me by",
      default: "email",
      options: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone" },
      ],
    },
    {
      name: "email",
      type: "email",
      label: "Email address",
      required: true,
      visibleIf: { field: "contact", equals: "email" },
    },
    {
      name: "phone",
      label: "Phone number",
      required: true,
      visibleIf: { field: "contact", equals: "phone" },
    },
    {
      name: "callTime",
      type: "time",
      label: "Best time to call",
      // A function sees all the values.
      visibleIf: (values) => values.contact === "phone" && !!values.phone,
    },
  ];

  let hidden = "omit";
  let values = "";
</script>

<Stack gap={6}>
  <RadioButtonGroup legendText="Hidden fields" bind:selected={hidden}>
    <RadioButton value="omit" labelText="Leave out of the values" />
    <RadioButton value="keep" labelText="Keep in the values" />
  </RadioButtonGroup>
  {#key hidden}
    <SchemaForm
      {fields}
      {hidden}
      on:submit={(event) => (values = JSON.stringify(event.detail, null, 2))}
    />
  {/key}
  {#if values}
    <CodeSnippet type="multi" code={values} />
  {/if}
</Stack>
