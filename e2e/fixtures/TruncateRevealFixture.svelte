<script>
  import { Truncate } from "carbon-components-svelte";

  const message =
    "Failed to deploy revision 214: container image ghcr.io/acme-corp/payments-api:2.4.1-rc3 exceeded the memory limit configured for the production namespace.";
</script>

<main style="padding: 4rem 1rem; max-width: 16rem;">
  <button type="button" data-testid="before">Before</button>
  <Truncate reveal="tooltip" data-testid="clipped">{message}</Truncate>
  <Truncate reveal="tooltip" data-testid="fits">Deployed revision 215.</Truncate
  >
  <Truncate reveal="tooltip" clamp="front" data-testid="front">
    /var/log/kubernetes/production/payments-api/pods/payments-api-7f9c8d6b4d-x2kql/container.log
  </Truncate>
  <Truncate reveal="expand" lines={2} data-testid="expand">{message}</Truncate>
  <button type="button" data-testid="after">After</button>
</main>
