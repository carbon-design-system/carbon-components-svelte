<script>
  import { Flag } from "carbon-components-svelte";
  import { flags } from "carbon-components-svelte/flags/all";

  // `?dir=rtl` and `?theme=g100` set the page before anything mounts.
  const params = new URLSearchParams(window.location.search);
  if (params.get("dir") === "rtl") document.documentElement.dir = "rtl";
  if (params.get("theme") === "g100") {
    document.documentElement.classList.add("bx--g100");
  }

  const sizes = [16, 20, 24, 32];
  const row = ["JP", "FR", "GB", "US", "PK", "ZA", "CH", "BR"];
  const all = Object.values(flags);
</script>

{#each sizes as size}
  <p data-testid="row-{size}">
    {#each row as code}
      <Flag flag={flags[code]} {size} data-testid="flag-{code}-{size}" />
    {/each}
    <Flag code="XK" {size} data-testid="badge-{size}" />
  </p>
{/each}

<p>
  <Flag flag={flags.NO} size={32} title="Norway" data-testid="named" />
  <span data-testid="all">
    {#each all as flag (flag.code)}
      <Flag {flag} size={16} data-flag={flag.code} />
    {/each}
  </span>
</p>
