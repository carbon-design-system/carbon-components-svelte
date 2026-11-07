<script>
  import {
    estimatePasswordStrength,
    PasswordInput,
    PasswordStrength,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let strength;
  let errors = 0;

  // Stands in for zxcvbn-ts or a call to your server. The password is
  // an argument only: it is never logged, and a server receives at most a
  // hash prefix (see "Privacy").
  async function estimate(password, { userInputs, signal }) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const { score, feedback } = estimatePasswordStrength(password, {
      userInputs,
    });
    return { score, feedback };
  }
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    aria-describedby="async-strength"
    bind:value
    on:blur={() => strength.flush()}
  />
  <PasswordStrength
    bind:this={strength}
    id="async-strength"
    {value}
    {estimate}
    on:error={() => (errors += 1)}
  />
  {#if errors}
    <p>The estimate failed {errors} time(s); the built-in one is shown.</p>
  {/if}
</Stack>
