<script>
  import { CurrencyInput, Stack } from "carbon-components-svelte";

  const fields = [
    { label: "United States", locale: "en-US", currency: "USD" },
    { label: "Germany", locale: "de-DE", currency: "EUR" },
    { label: "Ireland", locale: "en-IE", currency: "EUR" },
    { label: "Switzerland", locale: "fr-CH", currency: "CHF" },
    { label: "India", locale: "en-IN", currency: "INR" },
    { label: "Japan", locale: "ja-JP", currency: "JPY" },
    { label: "Egypt", locale: "ar-EG", currency: "EGP" },
  ];

  let values = fields.map(() => "1234567.89");
</script>

<Stack gap={4}>
  {#each fields as field, i}
    <CurrencyInput
      labelText="{field.label} ({field.locale})"
      locale={field.locale}
      currency={field.currency}
      bind:value={values[i]}
      helperText="Value: {values[i]}"
    />
  {/each}
</Stack>
