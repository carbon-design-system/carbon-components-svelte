<script>
  import { InlineSuggest, Stack, TextInput } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let ref;
  let email = "ada.lovelace@gm";

  // The suggestion shows only in a focused field with the caret at the end,
  // so the page opens in that state.
  onMount(() => {
    ref?.focus();
    ref?.setSelectionRange(email.length, email.length);
  });
</script>

<Stack gap={6} style="max-width: 24rem; padding: 1rem">
  <TextInput
    bind:ref
    bind:value={email}
    labelText="Email"
    helperText="Type an address"
  />
  <InlineSuggest
    field={ref}
    source={["gmail.com", "github.com"]}
    after="@"
    acceptButton
  />
</Stack>
