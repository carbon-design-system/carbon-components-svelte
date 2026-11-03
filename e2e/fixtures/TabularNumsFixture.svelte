<script>
  import {
    BigNumber,
    Pagination,
    ProgressBar,
    RelativeTime,
  } from "carbon-components-svelte";

  const now = Date.parse("2026-09-01T12:00:00Z");
</script>

<!-- Components whose numbers change in place. Each draws them in tabular figures. -->
<RelativeTime date={now - 5 * 60_000} {now} live={false} />
<Pagination totalItems={1024} page={11} />
<Pagination simple totalItems={1024} page={11} />
<BigNumber labelText="Requests" value={1111} total={2048} delta={11} />
<ProgressBar labelText="Upload" value={11} valueText="11%" />
