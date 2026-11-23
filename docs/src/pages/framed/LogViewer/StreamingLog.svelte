<script>
  import { Button, LogViewer, Stack } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const services = [
    "checkout-api",
    "payments-db",
    "auth-gateway",
    "search-indexer",
  ];
  const messages = [
    ["info", "request completed in 42ms"],
    ["info", "published event order.created"],
    ["debug", "acquired connection from pool (3/20 in use)"],
    ["warn", "retrying upstream call (attempt 2 of 3)"],
    ["error", "upstream returned 503 after 4210ms"],
  ];

  let viewer;
  let follow = true;
  let streaming = false;
  let timer;
  let count = 0;

  function nextLine() {
    const [level, text] = messages[count % messages.length];
    const service = services[count % services.length];
    count += 1;
    return { level, time: Date.now(), text: `[${service}] ${text}` };
  }

  // 20 lines every 20ms is 1,000 lines a second. `append` takes any number
  // of lines and draws them once per frame.
  function toggle() {
    streaming = !streaming;
    clearInterval(timer);
    if (streaming) {
      timer = setInterval(() => {
        viewer.append(Array.from({ length: 20 }, nextLine));
      }, 20);
    }
  }

  onMount(() => () => clearInterval(timer));
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={3}>
    <Button size="small" on:click={toggle}>
      {streaming ? "Stop streaming" : "Stream 1,000 lines a second"}
    </Button>
    <Button size="small" kind="tertiary" on:click={() => viewer.clear()}>
      Clear
    </Button>
  </Stack>
  <LogViewer
    bind:this={viewer}
    bind:follow
    labelText="Deployment log"
    height="20rem"
    maxLines={5000}
    timestamps
  />
</Stack>
