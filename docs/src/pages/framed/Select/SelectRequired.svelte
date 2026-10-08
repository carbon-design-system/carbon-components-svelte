<script>
  import {
    Button,
    Form,
    Select,
    SelectItem,
    Stack,
  } from "carbon-components-svelte";

  let submitted = false;
</script>

<Form
  on:submit={(e) => {
    e.preventDefault();
    submitted = true;
  }}
>
  <Stack gap={5}>
    <Select required labelText="Account plan">
      <SelectItem value="" text="Choose a plan" />
      <SelectItem value="free" text="Free" />
      <SelectItem value="team" text="Team" />
    </Select>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
