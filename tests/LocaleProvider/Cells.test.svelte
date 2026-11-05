<script lang="ts">
  import LocaleProvider from "carbon-components-svelte/LocaleProvider/LocaleProvider.svelte";
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  export let locale: string;
  export let count = 200;

  const now = Date.parse("2026-09-13T12:00:00Z");
</script>

<LocaleProvider {locale} timeZone="UTC">
  {#each Array.from({ length: count }, (_, index) => index) as index (index)}
    <RelativeTime date={now - (index + 1) * 60 * 1000} {now} live={false} />
  {/each}
</LocaleProvider>
