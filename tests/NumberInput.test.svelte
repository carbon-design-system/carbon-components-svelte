<script lang="ts">
  import { NumberInput, NumberInputSkeleton } from "../types";
</script>

<NumberInput
  label="Clusters"
  on:change="{(e) => {
    console.log(e.detail); // number
  }}"
/>

<NumberInput
  label="Clusters"
  helperText="Clusters provisioned in your region"
/>

<NumberInput
  min="{4}"
  max="{20}"
  value="{4}"
  invalidText="Number must be between 4 and 20."
  helperText="Clusters provisioned in your region"
  label="Clusters (4 min, 20 max)"
/>

<NumberInput hideLabel label="Clusters" />

<NumberInput light label="Clusters" />

<NumberInput mobile label="Clusters" />

<NumberInput size="xl" label="Clusters" />

<NumberInput size="sm" label="Clusters" />

<NumberInput invalid invalidText="An error occurred" label="Clusters" />

<NumberInput disabled label="Clusters" />

<NumberInputSkeleton />

<NumberInputSkeleton hideLabel />
