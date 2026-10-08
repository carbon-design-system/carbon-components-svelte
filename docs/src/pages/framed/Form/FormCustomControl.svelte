<script>
  import {
    FormHelperText,
    FormItem,
    FormLabel,
    FormRequirement,
  } from "carbon-components-svelte";

  let workEmail = "ada@example";

  $: workEmailError =
    workEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(workEmail)
      ? "Enter an email address like name@example.com"
      : "";
  $: workEmailWarning = workEmail.endsWith("@gmail.com")
    ? "Use your work email if you have one"
    : "";
</script>

<FormItem controlId="custom-control-email" let:control let:invalid>
  <FormLabel>Work email</FormLabel>
  <input
    class="bx--text-input"
    type="email"
    data-invalid={invalid || undefined}
    bind:value={workEmail}
    use:control
  >
  <FormHelperText>We send the invite here</FormHelperText>
  {#if workEmailError}
    <FormRequirement>{workEmailError}</FormRequirement>
  {:else if workEmailWarning}
    <FormRequirement kind="warn">{workEmailWarning}</FormRequirement>
  {/if}
</FormItem>
