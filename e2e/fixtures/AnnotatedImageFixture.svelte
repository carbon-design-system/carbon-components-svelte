<script lang="ts">
  import { AnnotatedImage, Link } from "carbon-components-svelte";

  // 1200 x 800. A red target at 30% / 60% and a blue one at 70% / 25%, so a
  // pin on a target shows whether the pin and the image agree.
  const targets = [
    { x: 30, y: 60, color: "#da1e28" },
    { x: 70, y: 25, color: "#0f62fe" },
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e5e5e5"/><stop offset="1" stop-color="#6f6f6f"/>
  </linearGradient></defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  ${targets
    .map(
      (t) =>
        `<circle cx="${(t.x / 100) * 1200}" cy="${(t.y / 100) * 800}" r="28" fill="${t.color}"/>`,
    )
    .join("")}
</svg>`;
  const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  const pins = [
    {
      id: "a",
      x: 30,
      y: 60,
      label: "Battery",
      description: "Lasts ten hours.",
    },
    {
      id: "b",
      x: 70,
      y: 25,
      label: "Camera",
      description: "Twelve megapixels.",
    },
    { id: "c", x: 2, y: 3, label: "Top left corner" },
    { id: "d", x: 98, y: 97, label: "Bottom right corner" },
  ];

  let editPins = [
    { id: "e1", x: 30, y: 60, label: "Battery" },
    { id: "e2", x: 70, y: 25, label: "Camera" },
  ];
  let changes: string[] = [];
  let openId: string | number | null = null;
</script>

<!-- A pin at the edge hangs half its size outside the image, so the page needs room beside it. -->
<div style="padding-inline: 1rem">
  <div data-testid="basic">
    <AnnotatedImage
      {src}
      alt="A phone, front and back"
      width={1200}
      height={800}
      {pins}
      legend="end"
      bind:openId
    />
  </div>
  <output data-testid="open-id">{openId}</output>

  <div data-testid="crop" style="max-inline-size: 320px">
    <AnnotatedImage
      {src}
      alt="A phone, cropped to a square"
      width={1200}
      height={800}
      ratio="1x1"
      focalPoint={{ x: 30, y: 50 }}
      pins={pins.slice(0, 2)}
    />
  </div>

  <div data-testid="contain" style="max-inline-size: 320px">
    <AnnotatedImage
      {src}
      alt="A phone, fit in a square"
      width={1200}
      height={800}
      ratio="1x1"
      fit="contain"
      pins={pins.slice(0, 2)}
    />
  </div>

  <div data-testid="roving" style="max-inline-size: 480px">
    <AnnotatedImage
      {src}
      alt="A phone"
      width={1200}
      height={800}
      pins={pins.slice(0, 3)}
      keyboard="roving"
    />
  </div>

  <div data-testid="small" style="max-inline-size: 480px">
    <AnnotatedImage
      {src}
      alt="A phone, crowded"
      width={1200}
      height={800}
      size="sm"
      pins={[
        { id: "s1", x: 50, y: 50, label: "One" },
        { id: "s2", x: 53, y: 50, label: "Two" },
      ]}
    />
  </div>

  <div data-testid="slots" style="max-inline-size: 480px">
    <AnnotatedImage
      {src}
      alt="A phone"
      width={1200}
      height={800}
      {pins}
      let:pin
    >
      <p>{pin.label}</p>
      <Link href="#buy">Buy</Link>
      <svelte:fragment slot="marker">★</svelte:fragment>
    </AnnotatedImage>
  </div>

  <div data-testid="editable">
    <AnnotatedImage
      {src}
      alt="A phone, editable"
      width={1200}
      height={800}
      editable
      bind:pins={editPins}
      legend="bottom"
      on:change={(event) =>
        (changes = [
          ...changes,
          `${event.detail.action}:${event.detail.pin.id}`,
        ])}
    />
  </div>
  <output data-testid="edit-pins"
    >{JSON.stringify(editPins.map((p) => [p.x, p.y]))}</output
  >
  <output data-testid="edit-changes">{changes.join(",")}</output>
</div>
