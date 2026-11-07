<script>
  import { Button, Stack, TimezonePicker } from "carbon-components-svelte";

  let locale = "en";
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={3}>
    {#each ["en", "de", "ja", "ar", "he"] as option}
      <Button
        size="small"
        kind={locale === option ? "primary" : "tertiary"}
        on:click={() => (locale = option)}>{option}</Button
      >
    {/each}
  </Stack>
  <TimezonePicker
    labelText="Time zone"
    {locale}
    detect={false}
    value="Europe/Paris"
  />
</Stack>
