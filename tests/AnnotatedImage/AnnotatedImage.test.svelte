<svelte:options accessors />

<script lang="ts">
  import AnnotatedImage from "carbon-components-svelte/AnnotatedImage/AnnotatedImage.svelte";
  import type { ComponentProps } from "svelte";

  export let pins: ComponentProps<AnnotatedImage>["pins"] = [
    {
      id: "a",
      x: 30,
      y: 60,
      label: "Battery",
      description: "Lasts ten hours.",
    },
    { id: "b", x: 70, y: 25, label: "Camera" },
    { id: "c", x: 5, y: 95, label: "Port", marker: "C" },
  ];
  export let openId: string | number | null = null;
  export let legend: ComponentProps<AnnotatedImage>["legend"] = false;
  export let keyboard: ComponentProps<AnnotatedImage>["keyboard"] = "tab";
  export let editable = false;
  export let ratio: ComponentProps<AnnotatedImage>["ratio"] = undefined;
  export let changes: string[] = [];
</script>

<AnnotatedImage
  src="/phone.png"
  alt="A phone"
  width={1200}
  height={800}
  {legend}
  {keyboard}
  {editable}
  {ratio}
  bind:pins
  bind:openId
  on:change={(event) =>
    (changes = [...changes, `${event.detail.action}:${event.detail.pin.id}`])}
/>
