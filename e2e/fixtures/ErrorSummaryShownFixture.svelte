<script>
  import {
    Button,
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

  // A failed submit, already rendered, as a server-rendered page shows it.
  const errors = [
    { fieldId: "name", message: "Enter your full name" },
    {
      fieldId: "email",
      message: "Enter an email address like name@example.com",
    },
    { fieldId: "birthday", message: "Enter your date of birth" },
    { fieldId: "plan", message: "Choose a plan" },
    {
      fieldId: "password",
      message: "Enter a password of at least 12 characters",
    },
  ];
</script>

<Form novalidate>
  <Stack gap={6}>
    <ErrorSummary {errors} title="Fix 5 errors" data-testid="summary" />
    <TextInput
      id="name"
      labelText="Full name"
      invalid
      invalidText={errors[0].message}
    />
    <TextInput
      id="email"
      type="email"
      labelText="Email"
      invalid
      invalidText={errors[1].message}
    />
    <DatePicker datePickerType="single">
      <DatePickerInput
        id="birthday"
        labelText="Date of birth"
        placeholder="mm/dd/yyyy"
        invalid
        invalidText={errors[2].message}
      />
    </DatePicker>
    <RadioButtonGroup
      id="plan"
      legendText="Plan"
      invalid
      invalidText={errors[3].message}
    >
      <RadioButton value="free" labelText="Free (1 GB)" />
      <RadioButton value="standard" labelText="Standard (10 GB)" />
      <RadioButton value="pro" labelText="Pro (128 GB)" />
    </RadioButtonGroup>
    <PasswordInput
      id="password"
      labelText="Password"
      invalid
      invalidText={errors[4].message}
    />
    <Button type="submit">Create account</Button>
  </Stack>
</Form>
