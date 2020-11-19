<script lang="ts">
  import { Button, Modal } from "../types";

  let open = false;
</script>

<Button kind="tertiary" on:click="{() => (open = true)}">Learn more</Button>

<Modal passiveModal bind:open modalHeading="IBM Cloudant" on:open on:close>
  <p>
    IBM Cloudant is a distributed, secure database with global availability and
    zero vendor lock-in used to build web and mobile apps at scale.
  </p>
</Modal>
