<script>
  import { AddressForm, Button, Stack } from "carbon-components-svelte";

  let us = { country: "US" };
  let jp = { country: "JP" };
  let sa = { country: "SA" };
  let form;
  let result = "";

  const arabic = {
    country: "البلد",
    line1: "العنوان 1",
    line2: "العنوان 2",
    locality: "المدينة",
    region: "المنطقة",
    postalCode: "الرمز البريدي",
  };

  function check() {
    result = JSON.stringify(form.validate().errors);
  }
</script>

<Stack gap={7}>
  <div data-testid="address-us">
    <AddressForm
      id="us"
      bind:this={form}
      bind:value={us}
      legendText="Shipping address"
      include={["name"]}
      name="shipping"
      autocompletePrefix="shipping"
    />
    <Button size="sm" on:click={check}>Check</Button>
    <pre data-testid="address-us-value">{JSON.stringify(us)}</pre>
    <pre data-testid="address-us-errors">{result}</pre>
  </div>

  <div data-testid="address-narrow" style="max-width: 20rem">
    <AddressForm id="narrow" value={{ country: "US" }} legendText="Narrow" />
  </div>

  <div data-testid="address-jp">
    <AddressForm
      id="jp"
      bind:value={jp}
      legendText="Japanese address"
      include={["name", "organization"]}
    />
  </div>

  <div data-testid="address-sa" dir="rtl" lang="ar">
    <AddressForm
      id="sa"
      bind:value={sa}
      legendText="عنوان الشحن"
      locale="ar"
      labels={arabic}
      optionalText="اختياري"
      placeholder="اختر"
      countries={["SA", "AE", "US", "GB"]}
    />
  </div>
</Stack>
