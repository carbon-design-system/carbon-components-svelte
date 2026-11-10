<script>
  import { Mentions, Stack, TextInput } from "carbon-components-svelte";

  let small = null;
  let medium = null;
  let large = null;

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "@praman" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "@moyelaran" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "@hlindqvist" },
  ];
  const triggers = [{ char: "@", items: people }];
</script>

<Stack gap={5}>
  <TextInput bind:ref={small} labelText="Small (32px options)" />
  <Mentions field={small} {triggers} size="sm" />
  <TextInput bind:ref={medium} labelText="Medium (40px options)" />
  <Mentions field={medium} {triggers} size="md" />
  <TextInput bind:ref={large} labelText="Large (48px options)" />
  <Mentions field={large} {triggers} size="lg" />
</Stack>
