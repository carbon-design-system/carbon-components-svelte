<script>
  import { Button, Popover } from "carbon-components-svelte";

  let open = false;
  let containerRef;
</script>

<div
  data-testid="popover-container"
  bind:this={containerRef}
  style="position: relative; display: inline-block"
>
  <Button data-testid="open-popover" on:click={() => (open = !open)}>
    Toggle popover
  </Button>
  <Popover
    data-testid="popover"
    bind:open
    align="bottom"
    closeOnOutsideClick={false}
    on:click:outside={({ detail }) => {
      if (containerRef && !containerRef.contains(detail.target)) {
        open = false;
      }
    }}
  >
    <div data-testid="popover-content">Popover content</div>
    <Button data-testid="close-popover" on:click={() => (open = false)}>
      Close
    </Button>
  </Popover>
</div>
<div data-testid="outside" style="margin-top: 2rem; padding: 1rem">
  Click here to close
</div>
