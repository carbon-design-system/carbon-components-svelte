<script lang="ts">
  import PhoneInput from "carbon-components-svelte/PhoneInput/PhoneInput.svelte";

  export let value = "";
  export let country = "";
  export let countries: string[] | undefined = undefined;
  export let complete = false;
  export let detect = false;
  export let name: string | undefined = undefined;
  export let onChange: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <PhoneInput
    labelText="Phone"
    {countries}
    {detect}
    {name}
    bind:value
    bind:country
    bind:complete
    on:change={onChange}
  />
</form>
<p data-testid="value">{value}</p>
<p data-testid="country">{country}</p>
<p data-testid="complete">{complete}</p>
