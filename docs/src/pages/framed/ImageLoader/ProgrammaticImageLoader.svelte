<script>
  import { Button, ImageLoader } from "carbon-components-svelte";

  const src =
    "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";
  const srcError = `${src}1`;

  let imageLoader;
  let error;
</script>

<Button
  kind="ghost"
  disabled={!imageLoader || error}
  on:click={() => imageLoader.loadImage(srcError)}
>
  Simulate error
</Button>

<ImageLoader bind:this={imageLoader} bind:error fadeIn {src}>
  <svelte:fragment slot="error">
    <Button kind="ghost" on:click={() => imageLoader.loadImage(src)}>
      Error. Try again
    </Button>
  </svelte:fragment>
</ImageLoader>
