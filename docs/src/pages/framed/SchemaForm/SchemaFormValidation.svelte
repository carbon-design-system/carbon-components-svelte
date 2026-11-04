<script>
  import { CodeSnippet, SchemaForm, Stack } from "carbon-components-svelte";

  const taken = ["ada", "grace"];

  const fields = [
    {
      name: "username",
      label: "Username",
      helperText: "Try ada or grace",
      required: true,
      minLength: 3,
      // `signal` aborts when the user types again before the check ends.
      validate: (value, _values, { signal }) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () =>
              resolve(taken.includes(value) ? "That name is taken" : undefined),
            400,
          );
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    },
    { name: "email", type: "email", label: "Email", required: true },
    {
      name: "password",
      type: "password",
      label: "Password",
      required: true,
      minLength: 8,
      warn: (value) =>
        value && !/\d/.test(value)
          ? "Add a number to make it stronger"
          : undefined,
    },
    {
      name: "confirm",
      type: "password",
      label: "Confirm password",
      required: true,
      // Checked again when the password changes, once this field has been seen.
      dependsOn: ["password"],
      validate: (value, values) =>
        value === values.password ? undefined : "The passwords do not match",
    },
  ];

  const messages = {
    required: "Enter {label}",
    minLength: "{label} needs at least {min} characters",
  };

  let submitted;
</script>

<Stack gap={6}>
  <SchemaForm
    {fields}
    {messages}
    validateOn="blur"
    on:submit={(event) => (submitted = JSON.stringify(event.detail, null, 2))}
  />
  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
