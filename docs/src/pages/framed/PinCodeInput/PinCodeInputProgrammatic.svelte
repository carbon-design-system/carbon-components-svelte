<script>
  import {
    Button,
    ButtonSet,
    PinCodeInput,
    Stack,
  } from "carbon-components-svelte";

  let pinCodeInput;
  let value = "018";
</script>

<Stack gap={6}>
  <PinCodeInput
    bind:this={pinCodeInput}
    bind:value
    labelText="Verification code"
  />
  <div>value: {JSON.stringify(value)}</div>
  <Stack gap={4}>
    <ButtonSet>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.focusFirstInput()}
      >
        Focus first
      </Button>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.focusLastInput()}
      >
        Focus last
      </Button>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.focusNextEmptyInput()}
      >
        Focus next empty
      </Button>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.focusNext()}
      >
        Focus next
      </Button>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.focusFirstInput({ selectTextOnFocus: true })}
      >
        Focus first (select)
      </Button>
    </ButtonSet>
    <ButtonSet>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.clear()}
      >
        Clear
      </Button>
      <Button
        kind="tertiary"
        size="small"
        on:click={() => pinCodeInput?.clear({ focus: true })}
      >
        Clear (focus)
      </Button>
    </ButtonSet>
  </Stack>
</Stack>
