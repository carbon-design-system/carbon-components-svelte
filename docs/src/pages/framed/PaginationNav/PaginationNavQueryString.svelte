<script>
  import { PaginationNav, queryParam } from "carbon-components-svelte";

  const total = 10;

  const page = queryParam("page", {
    defaultValue: 1,
    parse: (raw) => {
      const value = Number(raw);
      return Number.isInteger(value) && value >= 1 && value <= total
        ? value
        : undefined;
    },
    // docs-only:start
    // Opt out of this docs site's router, which intercepts history calls.
    replace: (href) =>
      history.replaceState({ ...history.state, useRoutify: false }, "", href),
    // docs-only:end
  });
</script>

<PaginationNav {total} bind:page={$page} />
