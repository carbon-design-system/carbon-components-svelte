<script lang="ts">
  import { TextArea, TextAreaSkeleton } from "../types";
</script>

<TextArea
  value=""
  hideLabel
  light
  rows="{10}"
  labelText="App description"
  helperText="A rich description helps us better recommend related products and services"
  placeholder="Enter a description..."
  invalid
  invalidText="Only plain text characters are allowed"
  disabled
  on:paste
/>

<TextAreaSkeleton hideLabel />
