<script>
  import {
    Button,
    createForm,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  // The headless form owns the values, errors and touched state; the markup
  // is yours. Each field has its own store, so typing in one field does not
  // update the others.
  const form = createForm({
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email", format: "email", required: true },
    ],
    initialValues: { name: "Ada" },
  });

  const { values, dirty, isSubmitting } = form;
  const name = form.field("name");
  const email = form.field("email");

  let submitted = "";
</script>

<form
  on:submit|preventDefault={() =>
    form.submit((v) => {
      submitted = JSON.stringify(v);
    })}
>
  <Stack gap={5}>
    <TextInput
      labelText="Name"
      value={$name.value}
      invalid={!!$name.error}
      invalidText={$name.error}
      on:input={(e) => form.setValue("name", e.detail)}
      on:blur={() => form.blur("name")}
    />
    <TextInput
      labelText="Email"
      value={$email.value}
      invalid={!!$email.error}
      invalidText={$email.error}
      on:input={(e) => form.setValue("email", e.detail)}
      on:blur={() => form.blur("email")}
    />
    <Button type="submit" disabled={$isSubmitting}>Save</Button>
    <p>Changed: {$dirty}</p>
    <p>Values: {JSON.stringify($values)}</p>
    {#if submitted}<p>Saved: {submitted}</p>{/if}
  </Stack>
</form>
