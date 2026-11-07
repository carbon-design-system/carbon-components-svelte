<script>
  import { Button, Masonry, Tile } from "carbon-components-svelte";

  // Deterministic, uneven heights: the order of tops is the thing under test.
  const heights = Array.from({ length: 14 }, (_, i) => 56 + ((i * 53) % 140));

  // Items added at the front and taken out of the layout.
  let next = 100;
  let dynamic = [0, 1, 2, 3, 4, 5, 6, 7];
  let hidden = false;
  let tinted = false;

  // Images that arrive one after another and give their tile a height.
  const image = (i) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="${60 + ((i * 71) % 180)}"><rect width="100%" height="100%" fill="#8d8d8d"/></svg>`,
    )}`;
  let loaded = 0;
  let loading = false;
  function loadImages() {
    loading = true;
    const tick = () => {
      loaded += 1;
      if (loaded < 12) setTimeout(tick, 30);
      else loading = false;
    };
    tick();
  }
</script>

<div data-testid="auto-wrap" style:max-inline-size="48rem">
  <Masonry data-testid="auto" columnWidth="10rem">
    {#each heights as height, i}
      <Tile style="block-size: {height}px">
        <Button kind="ghost" size="small">Item {i + 1}</Button>
      </Tile>
    {/each}
  </Masonry>
</div>

<div data-testid="js-wrap" style:max-inline-size="48rem">
  <Masonry data-testid="js" columnWidth="10rem" native={false}>
    {#each heights as height, i}
      <Tile style="block-size: {height}px">
        <Button kind="ghost" size="small">Item {i + 1}</Button>
      </Tile>
    {/each}
  </Masonry>
</div>

<div data-testid="fixed-wrap" style:max-inline-size="48rem">
  <Masonry data-testid="fixed" columns={3} gap={3} native={false}>
    {#each heights as height, i}
      <Tile style="block-size: {height}px">
        <Button kind="ghost" size="small">Item {i + 1}</Button>
      </Tile>
    {/each}
  </Masonry>
</div>

<div data-testid="dynamic-wrap" style:max-inline-size="48rem">
  <Button
    size="small"
    data-testid="prepend"
    on:click={() => (dynamic = [(next += 1), ...dynamic])}
  >
    Add first
  </Button>
  <Button
    size="small"
    kind="secondary"
    data-testid="hide"
    on:click={() => (hidden = !hidden)}
  >
    Hide second
  </Button>
  <Button
    size="small"
    kind="tertiary"
    data-testid="tint"
    on:click={() => (tinted = !tinted)}
  >
    Outline
  </Button>
  <Masonry data-testid="dynamic" columnWidth="10rem" native={false}>
    {#each dynamic as id, i (id)}
      <Tile
        style="block-size: {56 + ((id * 53) % 140)}px; display: {hidden &&
        i === 1
          ? 'none'
          : 'block'}; outline: {tinted ? '2px solid red' : 'none'}"
      >
        <Button kind="ghost" size="small">Item {id}</Button>
      </Tile>
    {/each}
  </Masonry>
</div>

<div data-testid="late-wrap" style:max-inline-size="48rem">
  <Button
    size="small"
    data-testid="load-images"
    disabled={loading}
    on:click={loadImages}
  >
    Load images
  </Button>
  <Masonry
    data-testid="late"
    columnWidth="10rem"
    native={false}
    data-loaded={loaded >= 12 ? "true" : "false"}
  >
    {#each { length: 12 } as _, i}
      <Tile>
        {#if i < loaded}
          <img
            src={image(i)}
            alt=""
            style="display: block; inline-size: 100%"
          />
        {/if}
        <Button kind="ghost" size="small">Item {i + 1}</Button>
      </Tile>
    {/each}
  </Masonry>
</div>
