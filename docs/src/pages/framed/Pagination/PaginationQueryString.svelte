<script>
  import { Pagination } from "carbon-components-svelte";

  function readPageFromUrl() {
    if (typeof window === "undefined") return 1;
    const parsed = Number(
      new URL(window.location.href).searchParams.get("page"),
    );
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  }

  function writePageToUrl(page) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    try {
      window.history.replaceState(window.history.state, "", url);
    } catch (_e) {
      // Some embedding contexts (e.g., a sandboxed iframe) block history updates.
    }
  }

  let page = readPageFromUrl();

  $: writePageToUrl(page);
</script>

<Pagination totalItems={102} pageSizes={[10, 15, 20]} bind:page />
