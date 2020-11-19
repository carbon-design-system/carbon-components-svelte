<script lang="ts">
  import { InlineLoading } from "../types";
</script>

<InlineLoading />

<InlineLoading description="Loading metrics..." />

<InlineLoading status="active" description="Submitting..." />

<InlineLoading status="inactive" description="Cancelling..." />

<InlineLoading status="finished" description="Success" />

<InlineLoading status="error" description="An error occurred" />
