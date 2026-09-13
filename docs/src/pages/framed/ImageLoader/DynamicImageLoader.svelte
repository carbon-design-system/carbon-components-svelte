<script>
  import { Button, ImageLoader } from "carbon-components-svelte";

  const images = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg",
      alt: "Svelte logo",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Carbon-design-system-logo.png",
      alt: "Carbon Design System logo",
    },
  ];

  let index = 0;

  $: image = images[index];
</script>

<Button
  kind="ghost"
  on:click={() => {
    index = index === 0 ? 1 : 0;
  }}
>
  Toggle image
</Button>

<div style:margin-top="1rem" style:width="100%" style:max-width="120px">
  <ImageLoader ratio="1x1" fadeIn src={image.src} alt={image.alt} />
</div>
