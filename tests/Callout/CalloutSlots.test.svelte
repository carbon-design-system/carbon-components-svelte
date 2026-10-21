<script lang="ts">
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import Callout from "carbon-components-svelte/Notification/Callout.svelte";
</script>

<Callout kind="warning" titleId="quota-title">
  <svelte:fragment slot="titleChildren">Storage almost full</svelte:fragment>
  <svelte:fragment slot="subtitleChildren">
    <Link href="/settings/billing" aria-describedby="quota-title">
      Upgrade your plan
    </Link>
  </svelte:fragment>
  <p data-testid="extra">Older builds are removed first.</p>
</Callout>
