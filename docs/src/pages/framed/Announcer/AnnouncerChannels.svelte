<script>
  import { announce, Button, Stack } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let running = false;
  let said = [];
  let timer;

  // Three sources, 100 updates a second between them. Each channel keeps the
  // latest message and says it on its own schedule.
  function start() {
    running = true;
    said = [];
    let n = 0;
    timer = setInterval(() => {
      n += 1;
      if (n % 3 === 0) {
        announce(`${(n % 7) + 1} results`, {
          channel: "results",
          debounce: 800,
          dedupe: true,
        });
      } else if (n % 3 === 1) {
        announce(`${n} new events`, { channel: "events", throttle: 3000 });
      } else {
        announce("Reply started", { channel: "reply", dedupe: true });
      }
    }, 10);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.parentElement?.matches("[role=status]")) {
            said = [...said, node.textContent];
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      clearInterval(timer);
      observer.disconnect();
      running = false;
    }, 9000);
  }

  onMount(() => () => clearInterval(timer));
</script>

<Stack gap={4}>
  <Button disabled={running} on:click={start}>Run for 9 seconds</Button>
  <p>Spoken: {said.length}</p>
  <ul>
    {#each said as text}
      <li>{text}</li>
    {/each}
  </ul>
</Stack>
