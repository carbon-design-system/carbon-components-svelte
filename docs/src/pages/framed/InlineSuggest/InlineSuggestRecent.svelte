<script>
  import { InlineSuggest, TextInput } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  // Newest first. An app would keep these in a store.
  const recent = [
    "Quarterly revenue by region",
    "Quarterly review notes",
    "Churn by plan",
    "Onboarding funnel",
  ];
</script>

<TextInput
  bind:ref
  bind:value
  labelText="Report name"
  placeholder="Recent reports"
  helperText="The newest matching report is suggested"
/>
<InlineSuggest field={ref} source={recent} minLength={0} />
