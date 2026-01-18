<script>
  import { RadioButton, Stack } from "carbon-components-svelte";

  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  let checked = options.map(() => false);

  $: selected = options.find((_, i) => checked[i]);
</script>

<Stack gap={3}>
  <Stack orientation="horizontal">
    {#each options as option, i}
      <RadioButton
        bind:checked={checked[i]}
        value={option.value}
        labelText={option.label}
        name="implicit-group"
      />
    {/each}
  </Stack>

  <span>
    Selected:
    <strong>{selected?.label ?? "None"}</strong>
  </span>
</Stack>
