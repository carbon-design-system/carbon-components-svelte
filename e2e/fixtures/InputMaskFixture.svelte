<script>
  import { Form, mask, Stack, TextInput } from "carbon-components-svelte";

  let phone = "";
  let phoneRaw = "";
  let phoneComplete = false;
  let card = "";
  let iban = "";
  let date = "";
  let direct = "";
  let events = 0;

  /** @param {string} raw */
  const cardPattern = (raw) =>
    raw.startsWith("34") || raw.startsWith("37")
      ? "9999 999999 99999"
      : "9999 9999 9999 9999";
</script>

<Form on:submit={(e) => e.preventDefault()}>
  <Stack gap={6}>
    <div
      data-testid="phone"
      use:mask={{
        pattern: "(999) 999-9999",
        onchange: (detail) => {
          phoneRaw = detail.rawValue;
          phoneComplete = detail.complete;
        },
      }}
    >
      <TextInput
        labelText="Phone"
        helperText="Format: (555) 555-5555"
        placeholder="(___) ___-____"
        autocomplete="tel-national"
        name="phone"
        bind:value={phone}
        on:input={() => (events += 1)}
      />
    </div>
    <div use:mask={{ pattern: cardPattern }}>
      <TextInput
        labelText="Card number"
        helperText="Format: 16 digits, or 15 for American Express"
        autocomplete="cc-number"
        bind:value={card}
      />
    </div>
    <div use:mask={{ pattern: "AA99 9999 9999 9999 99" }}>
      <TextInput
        labelText="IBAN"
        helperText="Format: two letters, then digits"
        bind:value={iban}
      />
    </div>
    <div use:mask={{ pattern: "99/99/9999", eager: true }}>
      <TextInput
        labelText="Date"
        helperText="Format: DD/MM/YYYY"
        bind:value={date}
      />
    </div>
    <div>
      <label class="bx--label" for="direct">Direct input</label>
      <input
        id="direct"
        class="bx--text-input"
        bind:value={direct}
        use:mask={{ pattern: "999-999" }}
      />
    </div>
  </Stack>
</Form>

<p data-testid="phone-bound">{phone}</p>
<p data-testid="phone-raw">{phoneRaw}</p>
<p data-testid="phone-complete">{phoneComplete}</p>
<p data-testid="phone-events">{events}</p>
<p data-testid="card-bound">{card}</p>
<p data-testid="iban-bound">{iban}</p>
<p data-testid="date-bound">{date}</p>
<p data-testid="direct-bound">{direct}</p>
