<script>
  import { Button, PinCodeInput, Stack } from "carbon-components-svelte";

  let value = "";
  let complete = false;
  let alphanumericValue = "";
  let programmaticValue = "018";
  let pinCodeInput;
</script>

<Stack gap={7}>
  <div data-testid="pin-code-input-default">
    <PinCodeInput labelText="Verification code" bind:value bind:complete />
    <span data-testid="pin-code-input-value">{value}</span>
    <span data-testid="pin-code-input-complete">{complete}</span>
  </div>

  <div data-testid="pin-code-input-alphanumeric">
    <PinCodeInput
      labelText="Invite code"
      type="alphanumeric"
      bind:value={alphanumericValue}
    />
    <span data-testid="pin-code-input-alphanumeric-value"
      >{alphanumericValue}</span
    >
  </div>

  <div data-testid="pin-code-input-invalid">
    <PinCodeInput
      labelText="Verification code"
      invalid={true}
      invalidText="Incorrect code"
      value="018"
    />
  </div>

  <div data-testid="pin-code-input-disabled">
    <PinCodeInput labelText="Verification code" disabled={true} value="0182" />
  </div>

  <div data-testid="pin-code-input-readonly">
    <PinCodeInput labelText="Verification code" readonly={true} value="0182" />
  </div>

  <div data-testid="pin-code-input-programmatic">
    <PinCodeInput
      bind:this={pinCodeInput}
      labelText="Verification code"
      bind:value={programmaticValue}
    />
    <span data-testid="pin-code-input-programmatic-value"
      >{programmaticValue}</span
    >
    <Button
      data-testid="pin-code-input-clear"
      kind="tertiary"
      size="small"
      on:click={() => pinCodeInput?.clear()}
    >
      Clear
    </Button>
  </div>
</Stack>
