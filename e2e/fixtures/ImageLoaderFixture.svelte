<script>
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";

  const scene = new URLSearchParams(location.search).get("scene") ?? "visual";
  const token = new URLSearchParams(location.search).get("token") ?? "t";

  /** A 400x300 picture drawn in the page, so no request is made. */
  function drawn() {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, "#0f62fe");
    gradient.addColorStop(1, "#8a3ffc");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 400, 300);
    // A marker in the top-left corner, so a crop shows which part stays.
    context.fillStyle = "#da1e28";
    context.fillRect(0, 0, 70, 50);
    context.fillStyle = "#fff";
    context.font = "bold 28px sans-serif";
    context.fillText("TL", 14, 36);
    return canvas.toDataURL("image/png");
  }

  const photo = scene === "visual" ? drawn() : "";
  /** A 4x3 thumbnail, which the placeholder stretches and blurs. */
  function thumbnail() {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 3;
    const context = canvas.getContext("2d");
    const colors = ["#0f62fe", "#4589ff", "#8a3ffc", "#da1e28"];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        context.fillStyle = colors[(x + y) % colors.length];
        context.fillRect(x, y, 1, 1);
      }
    }
    return canvas.toDataURL("image/png");
  }

  const lqip = scene === "visual" ? thumbnail() : "";

  let again = false;
</script>

{#if scene === "visual"}
  <div class="grid">
    <div data-testid="no-fit" class="cell">
      <ImageLoader src={photo} alt="Photo, no fit" ratio="1x1" />
    </div>
    <div data-testid="cover" class="cell">
      <ImageLoader src={photo} alt="Photo, cover" ratio="1x1" fit="cover" />
    </div>
    <div data-testid="focal" class="cell">
      <ImageLoader
        src={photo}
        alt="Photo, focal point top left"
        ratio="1x1"
        focalPoint="0% 0%"
      />
    </div>
    <div data-testid="contain" class="cell">
      <ImageLoader src={photo} alt="Photo, contain" ratio="1x1" fit="contain" />
    </div>
    <div data-testid="placeholder-color" class="cell">
      <ImageLoader
        src="/pending/{token}-color.png"
        alt=""
        ratio="4x3"
        placeholder="#7f5fa3"
      />
    </div>
    <div data-testid="placeholder-blur" class="cell">
      <ImageLoader
        src="/pending/{token}-blur.png"
        alt=""
        ratio="4x3"
        placeholder={lqip}
      />
    </div>
    <div data-testid="placeholder-skeleton" class="cell">
      <ImageLoader
        src="/pending/{token}-skeleton.png"
        alt=""
        ratio="4x3"
        fadeIn
        placeholder
      />
    </div>
    <div data-testid="dimensions" class="cell">
      <ImageLoader
        src="/pending/{token}-dimensions.png"
        alt=""
        width="400"
        height="300"
        placeholder
      />
    </div>
    <div data-testid="error" class="cell">
      <ImageLoader src="/missing/{token}.png" alt="Missing photo" ratio="4x3">
        <svelte:fragment slot="error" let:retry>
          <div class="error">
            <p>Unable to load the photo.</p>
            <Button size="sm" kind="tertiary" on:click={retry}>Retry</Button>
          </div>
        </svelte:fragment>
      </ImageLoader>
    </div>
  </div>
{:else if scene === "network"}
  <div class="cell" data-testid="srcset" style="width: 300px">
    <ImageLoader
      src="/img/w400.png?{token}"
      srcset="/img/w200.png?{token} 200w, /img/w800.png?{token} 800w"
      sizes="300px"
      alt="Srcset"
      ratio="4x3"
    />
  </div>
  <div class="cell" data-testid="sources" style="width: 300px">
    <ImageLoader
      src="/img/w400.png?s{token}"
      alt="Sources"
      ratio="4x3"
      sources={[
        { srcset: `/img/w200.png?s${token}`, media: "(max-width: 500px)" },
        { srcset: `/img/w800.png?s${token}`, media: "(min-width: 501px)" },
      ]}
    />
  </div>
  <div class="cell" data-testid="shift" style="width: 300px">
    <ImageLoader
      src="/img/w400.png?h{token}"
      alt="Dimensions"
      width="400"
      height="300"
    />
  </div>
  <div class="cell" data-testid="retry" style="width: 300px">
    <ImageLoader src="/flaky/{token}.png" alt="Flaky" ratio="4x3">
      <svelte:fragment slot="loading">
        <span data-testid="retry-loading">Loading</span>
      </svelte:fragment>
      <svelte:fragment slot="error" let:retry>
        <Button size="sm" kind="tertiary" on:click={retry}>Retry</Button>
      </svelte:fragment>
    </ImageLoader>
  </div>
  <div class="cell" data-testid="first" style="width: 300px">
    <ImageLoader src="/img/w400.png?c{token}" alt="First" ratio="4x3" />
  </div>
  <Button size="sm" on:click={() => (again = true)}>Show again</Button>
  {#if again}
    <div class="cell" data-testid="again" style="width: 300px">
      <ImageLoader src="/img/w400.png?c{token}" alt="Again" ratio="4x3">
        <svelte:fragment slot="loading">
          <span data-testid="again-loading">Loading</span>
        </svelte:fragment>
      </ImageLoader>
    </div>
  {/if}
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 12rem);
    gap: 1rem;
    padding: 1rem;
  }

  .cell {
    width: 12rem;
  }

  .grid .cell {
    border: 1px solid var(--cds-border-subtle);
  }

  .error {
    padding: 0.5rem;
  }
</style>
