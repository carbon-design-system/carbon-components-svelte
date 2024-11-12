<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal bind:open passiveModal modalHeading="About Cloudant" hasScrollingContent>
  <p>
    Cloudant is a fully managed, distributed database optimized for heavy
    workloads and fast-growing web and mobile apps, IBM Cloudant is available as
    an IBM Cloud® service with a 99.99% SLA.
  </p>
  <br />
  <p>
    The database elastically scales throughput and storage, and its API and
    replication protocols are compatible with Apache CouchDB for hybrid or
    multicloud architectures.
  </p>
</Modal>
