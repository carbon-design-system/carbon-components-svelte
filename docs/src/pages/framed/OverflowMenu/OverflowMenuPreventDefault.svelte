<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  let copying = false;
  let copied = false;

  async function copyToClipboard() {
    if (copying) return;
    copying = true;
    copied = false;
    await navigator.clipboard.writeText(
      "https://api.example.com/webhooks/incoming/8f2b41c9",
    );
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);

    copying = false;
  }
</script>

<OverflowMenu size="field">
  <OverflowMenuItem
    text={copied ? "Copied!" : "Copy webhook URL"}
    disabled={copying}
    on:click={(e) => {
      // Prevent menu from closing for this item.
      e.preventDefault();
      copyToClipboard();
    }}
  />
  <OverflowMenuItem text="Close menu" />
</OverflowMenu>
