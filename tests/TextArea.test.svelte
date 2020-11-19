<script lang="ts">
  import { TextArea, TextAreaSkeleton } from "../types";
</script>

<TextArea labelText="App description" placeholder="Enter a description..." />

<TextArea
  labelText="App description"
  helperText="A rich description helps us better recommend related products and services"
  placeholder="Enter a description..."
/>

<TextArea
  hideLabel
  labelText="App description"
  placeholder="Enter a description..."
/>

<TextArea
  light
  labelText="App description"
  placeholder="Enter a description..."
/>

<TextArea
  rows="{10}"
  labelText="App description"
  placeholder="Enter a description..."
/>

<TextArea
  invalid
  invalidText="Only plain text characters are allowed"
  labelText="App description"
  placeholder="Enter a description..."
/>

<TextArea
  disabled
  labelText="App description"
  placeholder="Enter a description..."
/>

<TextAreaSkeleton />

<TextAreaSkeleton hideLabel />
