<script>
  // `?n=200` anchors in a scrolling box, each with a floating tooltip held
  // open, to count what a page of open overlays costs and time the frame in
  // which they all place again.
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";

  const query = new URLSearchParams(location.search);
  const count = Number(query.get("n") ?? 200);
  const anchors = Array.from({ length: count }, () => null);
</script>

<div
  id="box"
  style="overflow: auto; height: 520px; width: 900px; margin: 1rem; border: 1px solid #8d8d8d"
>
  <div
    style="display: grid; grid-template-columns: repeat(10, 72px); gap: 3.5rem 1rem; padding: 4rem 1rem; height: 3000px"
  >
    {#each anchors as _, index}
      <button type="button" bind:this={anchors[index]} style="height: 1.5rem"
        >{index}</button
      >
      <FloatingPortal
        anchor={anchors[index]}
        open
        direction="top"
        intrinsicWidth
      >
        <div
          class="tip"
          style="padding: 2px 6px; background: #161616; color: #fff"
        >
          Tip {index}
        </div>
      </FloatingPortal>
    {/each}
  </div>
</div>
