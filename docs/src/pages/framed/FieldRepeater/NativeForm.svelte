<script>
  import {
    Button,
    CodeSnippet,
    FieldRepeater,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let phones = ["+1 555 0100", "+1 555 0101"];
  let posted = "";

  function submit(event) {
    const entries = [...new FormData(event.currentTarget)];
    posted = entries.map(([name, value]) => `${name}=${value}`).join("\n");
  }
</script>

<form on:submit|preventDefault={submit}>
  <Stack gap={6}>
    <FieldRepeater
      bind:items={phones}
      name="phones"
      itemName="phone number"
      legendText="Phone numbers"
      hideItemLabel
      let:index
      let:label
      let:fieldName
    >
      <TextInput
        name={fieldName}
        labelText={label}
        type="tel"
        bind:value={phones[index]}
      />
    </FieldRepeater>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if posted}
      <CodeSnippet type="multi" code={posted} />
    {/if}
  </Stack>
</form>
