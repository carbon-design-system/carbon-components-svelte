<script>
  import {
    CurrencyInput,
    Form,
    numberFormat,
    Stack,
    TextInput,
    UnitInput,
  } from "carbon-components-svelte";

  let usd = "";
  let eur = "";
  let jpy = "";
  let inr = "";
  let chf = "";
  let egp = "";
  let accounting = "";
  let weight = null;
  let percent = null;
  let direct = "";
  let usdEvents = 0;
  let usdChanges = 0;

  /** @type {{ value: string, text: string } | null} */
  let reported = null;
</script>

<Form on:submit={(e) => e.preventDefault()}>
  <Stack gap={6}>
    <CurrencyInput
      labelText="Price (USD)"
      helperText="en-US"
      currency="USD"
      name="usd"
      min="0"
      max="1000000"
      invalidText="Between 0 and 1,000,000"
      bind:value={usd}
      on:input={() => (usdEvents += 1)}
      on:change={() => (usdChanges += 1)}
    />
    <CurrencyInput
      labelText="Preis (EUR)"
      locale="de-DE"
      currency="EUR"
      bind:value={eur}
    />
    <CurrencyInput
      labelText="Price (JPY)"
      locale="ja-JP"
      currency="JPY"
      bind:value={jpy}
    />
    <CurrencyInput
      labelText="Price (INR)"
      locale="en-IN"
      currency="INR"
      bind:value={inr}
    />
    <CurrencyInput
      labelText="Preis (CHF)"
      locale="fr-CH"
      currency="CHF"
      bind:value={chf}
    />
    <CurrencyInput
      labelText="السعر (EGP)"
      locale="ar-EG"
      currency="EGP"
      allowNegative
      bind:value={egp}
    />
    <CurrencyInput
      labelText="Balance"
      currency="USD"
      currencySign="accounting"
      allowNegative
      bind:value={accounting}
    />
    <UnitInput labelText="Weight" unit="kg" bind:value={weight} />
    <UnitInput
      labelText="Discount"
      unit="%"
      locale="de-DE"
      max={100}
      bind:value={percent}
    />
    <UnitInput labelText="Timeout" unit="ms" />
    <UnitInput labelText="Disk" unit="GB" disabled value={512} />
    <UnitInput labelText="Memory" unit="GB" readonly value={16} />
    <UnitInput labelText="Warn" unit="kg" warn warnText="Heavy" value={90} />
    <div
      use:numberFormat={{
        locale: "en-US",
        currency: "USD",
        onchange: (detail) => {
          reported = { value: detail.value, text: detail.text };
        },
      }}
    >
      <TextInput labelText="Direct (action)" bind:value={direct} />
    </div>
  </Stack>
</Form>

<p data-testid="usd">{usd}</p>
<p data-testid="eur">{eur}</p>
<p data-testid="jpy">{jpy}</p>
<p data-testid="egp">{egp}</p>
<p data-testid="accounting">{accounting}</p>
<p data-testid="weight">{weight}</p>
<p data-testid="percent">{percent}</p>
<p data-testid="direct">{direct}</p>
<p data-testid="reported">{reported ? reported.value : ""}</p>
<p data-testid="usd-events">{usdEvents}</p>
<p data-testid="usd-changes">{usdChanges}</p>
