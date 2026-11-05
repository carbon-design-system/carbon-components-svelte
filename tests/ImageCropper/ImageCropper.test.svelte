<script lang="ts">
  import ImageCropper from "carbon-components-svelte/ImageCropper/ImageCropper.svelte";
  import type { ComponentProps } from "svelte";

  export let src: ComponentProps<ImageCropper>["src"] = "/photo.jpg";
  export let mode: ComponentProps<ImageCropper>["mode"] = "image";
  export let aspect: ComponentProps<ImageCropper>["aspect"] = 1;
  export let value: ComponentProps<ImageCropper>["value"] = null;
  export let minWidth = 1;
  export let translateWithId: ComponentProps<ImageCropper>["translateWithId"] =
    undefined;
  export let onChange: (detail: unknown) => void = () => {};
  export let onError: (detail: unknown) => void = () => {};
</script>

<ImageCropper
  bind:value
  {src}
  {mode}
  {aspect}
  {minWidth}
  {...translateWithId ? { translateWithId } : {}}
  on:change={(event) => onChange(event.detail)}
  on:error={(event) => onError(event.detail)}
/>
<p data-testid="value">{JSON.stringify(value)}</p>
