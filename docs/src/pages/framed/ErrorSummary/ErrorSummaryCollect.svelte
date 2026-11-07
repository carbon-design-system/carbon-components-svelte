<script>
  import {
    Button,
    collectFormErrors,
    DatePicker,
    DatePickerInput,
    ErrorSummary,
    Form,
    PasswordInput,
    RadioButton,
    RadioButtonGroup,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  let form = null;
  let summary;
  let errors = [];

  // The fields hold their own messages. Here they come from a validator;
  // they could as well come from the server or a schema.
  let messages = {};

  function validate(data) {
    const found = {};
    if (!data.get("name")) found.name = "Enter your full name";
    if (!data.get("email")?.toString().includes("@")) {
      found.email = "Enter an email address like name@example.com";
    }
    if (!data.get("birthday")) found.birthday = "Enter your date of birth";
    if (!data.get("plan")) found.plan = "Choose a plan";
    if ((data.get("password")?.toString().length ?? 0) < 12) {
      found.password = "Enter a password of at least 12 characters";
    }
    return found;
  }

  async function submit() {
    messages = validate(new FormData(form));
    // Read the DOM after the fields show their messages.
    await tick();
    errors = collectFormErrors(form);
    await tick();
    summary?.focus();
  }
</script>

<Form
  bind:ref={form}
  novalidate
  on:submit={(e) => {
    e.preventDefault();
    submit();
  }}
>
  <Stack gap={6}>
    <ErrorSummary bind:this={summary} {errors} />
    <TextInput
      name="name"
      labelText="Full name"
      invalid={!!messages.name}
      invalidText={messages.name}
    />
    <TextInput
      name="email"
      type="email"
      labelText="Email"
      invalid={!!messages.email}
      invalidText={messages.email}
    />
    <DatePicker datePickerType="single">
      <DatePickerInput
        name="birthday"
        labelText="Date of birth"
        placeholder="mm/dd/yyyy"
        invalid={!!messages.birthday}
        invalidText={messages.birthday}
      />
    </DatePicker>
    <RadioButtonGroup
      name="plan"
      legendText="Plan"
      invalid={!!messages.plan}
      invalidText={messages.plan}
    >
      <RadioButton value="free" labelText="Free (1 GB)" />
      <RadioButton value="standard" labelText="Standard (10 GB)" />
      <RadioButton value="pro" labelText="Pro (128 GB)" />
    </RadioButtonGroup>
    <PasswordInput
      name="password"
      labelText="Password"
      invalid={!!messages.password}
      invalidText={messages.password}
    />
    <Button type="submit">Create account</Button>
  </Stack>
</Form>
