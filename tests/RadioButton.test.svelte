<script lang="ts">
  import {
    FormGroup,
    RadioButton,
    RadioButtonSkeleton,
    RadioButtonGroup,
  } from "../types";
</script>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup selected="standard">
    <RadioButton labelText="Free (1 GB)" value="free" />
    <RadioButton labelText="Standard (10 GB)" value="standard" />
    <RadioButton labelText="Pro (128 GB)" value="pro" />
  </RadioButtonGroup>
</FormGroup>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup labelPosition="left" selected="standard">
    <RadioButton labelText="Free (1 GB)" value="free" />
    <RadioButton labelText="Standard (10 GB)" value="standard" />
    <RadioButton labelText="Pro (128 GB)" value="pro" />
  </RadioButtonGroup>
</FormGroup>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup orientation="vertical" selected="standard">
    <RadioButton labelText="Free (1 GB)" value="free" />
    <RadioButton labelText="Standard (10 GB)" value="standard" />
    <RadioButton labelText="Pro (128 GB)" value="pro" />
  </RadioButtonGroup>
</FormGroup>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup>
    <RadioButtonSkeleton />
    <RadioButtonSkeleton />
    <RadioButtonSkeleton />
  </RadioButtonGroup>
</FormGroup>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup orientation="vertical">
    <RadioButtonSkeleton />
    <RadioButtonSkeleton />
    <RadioButtonSkeleton />
  </RadioButtonGroup>
</FormGroup>
