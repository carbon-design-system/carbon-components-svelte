<script>
  import { DateCalendar, Stack, Text } from "carbon-components-svelte";

  let value = new Date();
</script>

<Stack gap={5}>
  <DateCalendar bind:value />
  <Text>Picked: {value?.toDateString() ?? "nothing"}</Text>
</Stack>
