<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    ErrorSummary,
    Form,
    InlineNotification,
    PasswordInput,
    RadioButton,
    RadioButtonGroup,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  let name = "";
  let email = "";
  let birthday = "";
  let plan = "";
  let password = "";

  /** Field id to message. The order is the order of the summary. */
  let errors = {};
  let created = false;
  let summary;

  function validate() {
    const found = {};
    if (!name.trim()) found["sign-up-name"] = "Enter your full name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      found["sign-up-email"] = "Enter an email address like name@example.com";
    }
    if (!birthday) found["sign-up-birthday"] = "Enter your date of birth";
    if (!plan) found["sign-up-plan"] = "Choose a plan";
    if (password.length < 12) {
      found["sign-up-password"] = "Enter a password of at least 12 characters";
    }
    return found;
  }

  $: list = Object.entries(errors).map(([fieldId, message]) => ({
    fieldId,
    message,
  }));

  async function submit() {
    errors = validate();
    created = Object.keys(errors).length === 0;
    // Wait for the summary to render, then move focus to it again, so a
    // second failed submit reads out the summary too.
    await tick();
    summary?.focus();
  }
</script>

<Form
  novalidate
  on:submit={(e) => {
    e.preventDefault();
    submit();
  }}
>
  <Stack gap={6}>
    <ErrorSummary
      bind:this={summary}
      errors={list}
      title={`Fix ${list.length} ${list.length === 1 ? "error" : "errors"}`}
    />
    {#if created}
      <InlineNotification
        kind="success"
        title="Account created"
        subtitle={`We sent a confirmation to ${email}.`}
        hideCloseButton
      />
    {/if}
    <TextInput
      id="sign-up-name"
      labelText="Full name"
      bind:value={name}
      invalid={"sign-up-name" in errors}
      invalidText={errors["sign-up-name"]}
    />
    <TextInput
      id="sign-up-email"
      type="email"
      labelText="Email"
      bind:value={email}
      invalid={"sign-up-email" in errors}
      invalidText={errors["sign-up-email"]}
    />
    <DatePicker datePickerType="single" bind:value={birthday}>
      <DatePickerInput
        id="sign-up-birthday"
        labelText="Date of birth"
        placeholder="mm/dd/yyyy"
        invalid={"sign-up-birthday" in errors}
        invalidText={errors["sign-up-birthday"]}
      />
    </DatePicker>
    <RadioButtonGroup
      id="sign-up-plan"
      legendText="Plan"
      bind:selected={plan}
      invalid={"sign-up-plan" in errors}
      invalidText={errors["sign-up-plan"]}
    >
      <RadioButton value="free" labelText="Free (1 GB)" />
      <RadioButton value="standard" labelText="Standard (10 GB)" />
      <RadioButton value="pro" labelText="Pro (128 GB)" />
    </RadioButtonGroup>
    <PasswordInput
      id="sign-up-password"
      labelText="Password"
      bind:value={password}
      invalid={"sign-up-password" in errors}
      invalidText={errors["sign-up-password"]}
    />
    <Button type="submit">Create account</Button>
  </Stack>
</Form>
