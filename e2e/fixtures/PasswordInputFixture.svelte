<script>
  import { Column, Grid, PasswordInput } from "carbon-components-svelte";

  let value = "";
</script>

<Grid>
  <Column>
    <PasswordInput
      data-testid="password-input"
      labelText="Password"
      placeholder="Enter password"
      bind:value
    />
  </Column>
</Grid>
