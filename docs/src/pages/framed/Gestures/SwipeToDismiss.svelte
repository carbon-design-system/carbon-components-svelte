<script>
  import { Button, gesture, Stack } from "carbon-components-svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";

  const DISMISS_FRACTION = 0.4;

  let messages = [
    { id: 1, from: "Priya Shah", text: "The build is green again." },
    { id: 2, from: "Marcus Webb", text: "Can you review the rollout plan?" },
    { id: 3, from: "Ines Okafor", text: "Lunch moved to 12:30." },
    { id: 4, from: "Deploy bot", text: "Release 4.2.1 is live in eu-west." },
  ];
  let offsets = {};
  let dragging = null;
  let leaving = {};
  let announcement = "";

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function remove(id) {
    const message = messages.find((item) => item.id === id);
    messages = messages.filter((item) => item.id !== id);
    delete offsets[id];
    delete leaving[id];
    offsets = offsets;
    leaving = leaving;
    announcement = `Dismissed message from ${message?.from}`;
  }

  function dismiss(id, direction) {
    if (leaving[id]) return;
    // Slide out and then remove. With reduced motion there is no slide.
    if (reducedMotion()) return remove(id);
    leaving = { ...leaving, [id]: true };
    offsets = { ...offsets, [id]: direction * 400 };
    setTimeout(() => remove(id), 160);
  }

  let width = 300;

  function startPan(id, event) {
    width = event.startEvent?.target?.closest(".message")?.offsetWidth ?? 300;
    dragging = id;
  }

  function endPan(id, event) {
    dragging = null;
    const far = Math.abs(event.deltaX) > width * DISMISS_FRACTION;
    // A flick dismisses through `swipe`, which fires right after this.
    if (!event.cancelled && far) dismiss(id, Math.sign(event.deltaX));
    else offsets = { ...offsets, [id]: 0 };
  }
</script>

<Stack gap={4}>
  <ul class="messages">
    {#each messages as message (message.id)}
      <li class="slot">
        <div
          class="message"
          class:dragging={dragging === message.id}
          class:leaving={leaving[message.id]}
          style:transform="translateX({offsets[message.id] ?? 0}px)"
          use:gesture={{
            // A horizontal pan leaves the page's vertical scroll alone.
            pan: {
              axis: "x",
              onStart: (event) => startPan(message.id, event),
              onMove: (event) =>
                (offsets = { ...offsets, [message.id]: event.deltaX }),
              onEnd: (event) => endPan(message.id, event),
            },
            swipe: {
              axis: "x",
              onSwipe: (event) =>
                dismiss(message.id, event.direction === "left" ? -1 : 1),
            },
          }}
        >
          <div class="body">
            <strong>{message.from}</strong>
            <span>{message.text}</span>
          </div>
          <Button
            size="small"
            kind="ghost"
            iconOnly
            icon={Close}
            iconDescription="Dismiss message from {message.from}"
            tooltipPosition="left"
            on:click={() => dismiss(message.id, 1)}
          />
        </div>
      </li>
    {:else}
      <li class="empty">No messages</li>
    {/each}
  </ul>
  <p class="help">
    Swipe a message sideways, or use its Dismiss button. A short drag springs
    back.
  </p>
  <div class="visually-hidden" aria-live="polite">{announcement}</div>
</Stack>

<style>
  .messages {
    margin: 0;
    padding: 0;
    overflow: hidden;
    list-style: none;
  }

  .slot {
    border-block-end: 1px solid var(--cds-border-subtle-01);
  }

  .message {
    display: flex;
    align-items: center;
    gap: var(--cds-spacing-03);
    padding-inline-start: var(--cds-spacing-05);
    background: var(--cds-layer-01);
    transition: transform 160ms;
  }

  .message.dragging {
    transition: none;
  }

  .message.leaving {
    opacity: 0;
    transition:
      transform 160ms,
      opacity 160ms;
  }

  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding-block: var(--cds-spacing-04);
  }

  .empty {
    padding: var(--cds-spacing-05);
    color: var(--cds-text-secondary);
  }

  .help {
    color: var(--cds-text-secondary);
    font-size: var(--cds-helper-text-01-font-size, 0.75rem);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .message,
    .message.leaving {
      transition: none;
    }
  }
</style>
