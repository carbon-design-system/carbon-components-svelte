<script>
  import {
    Button,
    gesture,
    INERTIA_MIN_SPEED,
    inertiaStep,
    Stack,
  } from "carbon-components-svelte";

  const WIDTH = 640;
  const HEIGHT = 400;
  const MAX_ZOOM = 6;
  const BUTTON_STEP = 1.5;

  // A plan to zoom into, drawn as an image so the example needs no file.
  const rooms = [
    { x: 24, y: 24, width: 200, height: 150, name: "Lobby" },
    { x: 240, y: 24, width: 180, height: 150, name: "Lab" },
    { x: 436, y: 24, width: 180, height: 150, name: "Archive" },
    { x: 24, y: 190, width: 260, height: 186, name: "Workshop" },
    { x: 300, y: 190, width: 316, height: 186, name: "Server room" },
  ];
  const plan = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="100%" height="100%" fill="#f4f4f4"/>${rooms
    .map(
      (room) =>
        `<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="#fff" stroke="#161616" stroke-width="2"/><text x="${room.x + 12}" y="${room.y + 28}" font-family="sans-serif" font-size="16" fill="#161616">${room.name}</text><text x="${room.x + 12}" y="${room.y + 48}" font-family="sans-serif" font-size="6" fill="#525252">Fire exit to the east</text>`,
    )
    .join("")}</svg>`;
  const src = `data:image/svg+xml,${encodeURIComponent(plan)}`;

  let frame;
  let frameWidth = 0;
  let frameHeight = 0;
  let scale = 1;
  let x = 0;
  let y = 0;
  let animate = false;
  let announcement = "";
  let flingFrame = null;
  let last = { x: 0, y: 0 };
  // While the whole image shows, a resize of the frame fits it again.
  let fitted = true;

  $: if (frameWidth && frameHeight && fitted) {
    place(fitScale(frameWidth, frameHeight), 0, 0);
  }

  $: percent = Math.round((scale / fitScale(frameWidth, frameHeight)) * 100);

  function fitScale(width, height) {
    return width && height ? Math.min(width / WIDTH, height / HEIGHT) : 1;
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Keep the image on screen, centered while it is smaller than the frame. */
  function place(nextScale, nextX, nextY) {
    const width = WIDTH * nextScale;
    const height = HEIGHT * nextScale;
    scale = nextScale;
    fitted = Math.abs(nextScale - fitScale(frameWidth, frameHeight)) < 1e-6;
    x =
      width <= frameWidth
        ? (frameWidth - width) / 2
        : Math.min(0, Math.max(frameWidth - width, nextX));
    y =
      height <= frameHeight
        ? (frameHeight - height) / 2
        : Math.min(0, Math.max(frameHeight - height, nextY));
  }

  function zoomAt(next, pointX, pointY) {
    const fit = fitScale(frameWidth, frameHeight);
    const target = Math.min(fit * MAX_ZOOM, Math.max(fit, next));
    const ratio = target / scale;
    place(target, pointX - (pointX - x) * ratio, pointY - (pointY - y) * ratio);
  }

  function toFrame(clientX, clientY) {
    const box = frame.getBoundingClientRect();
    return { x: clientX - box.left, y: clientY - box.top };
  }

  function stopFling() {
    if (flingFrame !== null) cancelAnimationFrame(flingFrame);
    flingFrame = null;
  }

  function fling(velocity) {
    // Reduced motion gets the pan where the finger left it.
    if (reducedMotion()) return;
    let moving = velocity;
    let previous = performance.now();
    function step(now) {
      const next = inertiaStep(moving, Math.min(now - previous, 50));
      previous = now;
      place(scale, x + next.dx, y + next.dy);
      moving = next.velocity;
      flingFrame =
        Math.hypot(moving.x, moving.y) < INERTIA_MIN_SPEED
          ? null
          : requestAnimationFrame(step);
    }
    if (Math.hypot(moving.x, moving.y) >= INERTIA_MIN_SPEED * 4) {
      flingFrame = requestAnimationFrame(step);
    }
  }

  function settle() {
    announcement = `Zoom ${percent}%`;
  }

  function reset() {
    animate = !reducedMotion();
    const fit = fitScale(frameWidth, frameHeight);
    place(fit, 0, 0);
    settle();
  }

  function zoomBy(factor) {
    stopFling();
    animate = !reducedMotion();
    zoomAt(scale * factor, frameWidth / 2, frameHeight / 2);
    settle();
  }

  function handleKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = {
      "+": () => zoomBy(BUTTON_STEP),
      "=": () => zoomBy(BUTTON_STEP),
      "-": () => zoomBy(1 / BUTTON_STEP),
      "0": reset,
      ArrowLeft: () => place(scale, x + 40, y),
      ArrowRight: () => place(scale, x - 40, y),
      ArrowUp: () => place(scale, x, y + 40),
      ArrowDown: () => place(scale, x, y - 40),
    };
    const run = keys[event.key];
    if (!run) return;
    animate = false;
    event.preventDefault();
    run();
  }

  const options = {
    pan: {
      onStart(event) {
        stopFling();
        animate = false;
        last = { x: event.clientX, y: event.clientY };
      },
      onMove(event) {
        place(scale, x + event.clientX - last.x, y + event.clientY - last.y);
        last = { x: event.clientX, y: event.clientY };
      },
      onEnd(event) {
        if (!event.cancelled) {
          fling({ x: event.velocityX, y: event.velocityY });
        }
      },
    },
    pinch: {
      onStart(event) {
        stopFling();
        animate = false;
        last = { x: event.clientX, y: event.clientY };
      },
      // Fingers, Ctrl and a wheel, and Safari's trackpad all arrive here.
      onChange(event) {
        const before = toFrame(last.x, last.y);
        zoomAt(scale * event.deltaScale, before.x, before.y);
        place(scale, x + event.clientX - last.x, y + event.clientY - last.y);
        last = { x: event.clientX, y: event.clientY };
      },
      onEnd: settle,
    },
    doubleTap(event) {
      stopFling();
      animate = !reducedMotion();
      const fit = fitScale(frameWidth, frameHeight);
      if (scale > fit * 1.05) reset();
      else {
        const point = toFrame(event.clientX, event.clientY);
        zoomAt(fit * 2.5, point.x, point.y);
        settle();
      }
    },
  };
</script>

<Stack gap={4}>
  <div class="actions">
    <Button
      size="small"
      kind="tertiary"
      on:click={() => zoomBy(1 / BUTTON_STEP)}>Zoom out</Button
    >
    <Button size="small" kind="tertiary" on:click={() => zoomBy(BUTTON_STEP)}
      >Zoom in</Button
    >
    <Button size="small" kind="ghost" on:click={reset}>Fit</Button>
    <span class="level">{percent}%</span>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={frame}
    bind:clientWidth={frameWidth}
    bind:clientHeight={frameHeight}
    class="frame"
    dir="ltr"
    role="group"
    tabindex="0"
    aria-label="Floor plan, zoomable"
    aria-describedby="zoom-help"
    use:gesture={options}
    on:keydown={handleKeydown}
  >
    <img
      class="layer"
      class:animate
      {src}
      alt="Floor plan with five rooms: Lobby, Lab, Archive, Workshop and Server room"
      width={WIDTH}
      height={HEIGHT}
      draggable="false"
      style:transform="translate({x}px, {y}px) scale({scale})"
      on:transitionend={() => (animate = false)}
    />
  </div>
  <p id="zoom-help" class="help">
    Pinch, scroll with Ctrl, or double-tap to zoom, and drag to pan. With the
    plan focused, press + and - to zoom, 0 to fit, and the arrow keys to pan.
  </p>
  <div class="visually-hidden" aria-live="polite">{announcement}</div>
</Stack>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cds-spacing-03);
  }

  .level {
    margin-inline-start: auto;
    color: var(--cds-text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .frame {
    position: relative;
    height: 20rem;
    overflow: hidden;
    background: var(--cds-layer-01);
    border: 1px solid var(--cds-border-subtle-01);
  }

  .frame:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .layer {
    position: absolute;
    top: 0;
    left: 0;
    max-width: none;
    transform-origin: 0 0;
    user-select: none;
  }

  .layer.animate {
    transition: transform 150ms;
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
    .layer.animate {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .frame:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
