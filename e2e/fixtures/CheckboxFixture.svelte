<script>
  import { Checkbox } from "carbon-components-svelte";

  let checked = false;
</script>

<Checkbox
  data-testid="checkbox-agree"
  labelText="I agree to the terms"
  bind:checked
/>

<Checkbox
  data-testid="checkbox-disabled"
  labelText="Disabled option"
  disabled={true}
/>

<div
  data-testid="checkbox-row"
  style:display="flex"
  style:align-items="center"
  style:gap="16px"
>
  <Checkbox inline labelText="Mark reviewed" />
  <span>3 files</span>
</div>

<div
  data-testid="checkbox-row-default"
  style:display="flex"
  style:align-items="center"
  style:gap="16px"
>
  <Checkbox labelText="Mark approved" />
  <span>5 files</span>
</div>
