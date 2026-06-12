<script lang="ts">
  import {
    Box,
    Button,
    Checkbox,
    Link,
    PasswordInput,
    Stack,
    Text,
    TextInput,
  } from "carbon-components-svelte";

  let email = "ada@hooli.com";
  let remember = true;
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Sign in to your account
    </Text>
    <Stack gap={5}>
      <TextInput labelText="Email" type="email" bind:value={email} />
      <PasswordInput labelText="Password" placeholder="Enter your password" />
      <Checkbox labelText="Keep me signed in" bind:checked={remember} />
      <Stack gap={4}>
        <Button>Sign in</Button>
        <Stack orientation="horizontal" gap={5}>
          <Link href="/">Forgot password?</Link>
          <Link href="/">Create an account</Link>
        </Stack>
      </Stack>
    </Stack>
  </Stack>
</Box>
