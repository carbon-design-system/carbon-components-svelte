<script lang="ts">
  import LocaleProvider from "carbon-components-svelte/LocaleProvider/LocaleProvider.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  /** Set on the server and the client alike. */
  export let provider: { locale?: string; timeZone?: string } | undefined =
    undefined;

  const now = Date.parse("2026-09-13T12:00:00Z");
</script>

<LocaleProvider {...provider} dir="auto">
  <RelativeTime date={now - 5 * 60 * 1000} {now} live={false} />
  <NumberInput labelText="Amount" id="amount" value={1234.5} />
</LocaleProvider>
