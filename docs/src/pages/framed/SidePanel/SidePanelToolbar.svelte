<script>
  import { Button, Content, Header, SidePanel } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Renew from "carbon-icons-svelte/lib/Renew.svelte";

  let open = true;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>View environment</Button>
</Content>

<SidePanel
  bind:open
  title="Environment"
  subtitle="Variables for checkout-api in production."
>
  <svelte:fragment slot="toolbar">
    <Button kind="ghost" size="small" icon={Renew}>Sync</Button>
    <Button kind="ghost" size="small" icon={Copy} iconDescription="Copy" />
    <Button
      kind="ghost"
      size="small"
      icon={Download}
      iconDescription="Download"
    />
  </svelte:fragment>
  <p>DATABASE_URL, REDIS_URL and 12 more.</p>
</SidePanel>
