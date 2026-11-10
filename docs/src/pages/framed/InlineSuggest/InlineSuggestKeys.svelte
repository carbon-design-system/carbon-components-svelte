<script>
  import { InlineSuggest, Stack, TextInput } from "carbon-components-svelte";

  let ref = null;
  let email = "";
  let name = "";

  const domains = ["gmail.com", "outlook.com", "icloud.com"];
</script>

<Stack gap={5}>
  <div>
    <TextInput
      bind:ref
      bind:value={email}
      type="email"
      labelText="Email"
      helperText="Only the right arrow accepts here, so Tab always moves on"
    />
    <InlineSuggest
      field={ref}
      source={domains}
      after="@"
      acceptKeys={["ArrowRight"]}
    />
  </div>
  <TextInput bind:value={name} labelText="Name" />
</Stack>
