<script>
  import {
    Checkbox,
    Content,
    Header,
    ShellBanner,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  // Highest priority first. Only one banner shows at a time.
  const notices = [
    {
      id: "offline",
      kind: "error",
      title: "You are offline. Changes are saved on this device.",
    },
    {
      id: "incident",
      kind: "warning",
      title: "Some API requests are failing.",
    },
    {
      id: "staging",
      kind: "info",
      title: "This is the staging environment.",
    },
  ];

  let active = { offline: false, incident: true, staging: true };

  $: current = notices.find((notice) => active[notice.id]);
</script>

<Header companyName="Acme" platformName="Admin">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
</Header>

{#key current?.id}
  {#if current}
    <ShellBanner
      placement="above-header"
      announce
      kind={current.kind}
      title={current.title}
    />
  {/if}
{/key}

<Content>
  <Stack gap={5}>
    <h1>One at a time</h1>
    <p>
      Two above-header banners would both write the offset, so show the first
      active notice in a priority list.
    </p>
    {#each notices as notice (notice.id)}
      <Checkbox labelText={notice.title} bind:checked={active[notice.id]} />
    {/each}
  </Stack>
</Content>
