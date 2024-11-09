<script lang="ts">
  import { RadioButton, RadioButtonSkeleton, RadioButtonGroup } from "carbon-components-svelte";
</script>

<RadioButtonGroup
  legendText="Storage tier (disk)"
  selected="standard"
  on:change="{(e) => {
    console.log(e.detail); // string
  }}"
>
  <RadioButton labelText="Free (1 GB)" value="free" />
  <RadioButton labelText="Standard (10 GB)" value="standard" />
  <RadioButton labelText="Pro (128 GB)" value="pro" />
</RadioButtonGroup>

<RadioButtonGroup
  legendText="Storage tier (disk)"
  labelPosition="left"
  selected="standard"
>
  <RadioButton labelText="Free (1 GB)" value="free" />
  <RadioButton labelText="Standard (10 GB)" value="standard" />
  <RadioButton labelText="Pro (128 GB)" value="pro" />
</RadioButtonGroup>

<RadioButtonGroup orientation="vertical" legendText="Storage tier (disk)">
  <RadioButtonSkeleton />
  <RadioButtonSkeleton />
  <RadioButtonSkeleton />
</RadioButtonGroup>
