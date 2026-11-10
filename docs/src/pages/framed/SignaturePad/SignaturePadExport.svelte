<script>
  import {
    Button,
    ButtonSet,
    SignaturePad,
    Stack,
  } from "carbon-components-svelte";

  let pad;
  let value = $state(null);

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadSvg() {
    const svg = pad.toSVG();
    if (svg)
      download(new Blob([svg], { type: "image/svg+xml" }), "signature.svg");
  }

  async function downloadPng() {
    // Four pixels per pad unit: 2400 by 800, for a print-ready copy.
    const png = await pad.toPNG({ scale: 4 });
    if (png) download(png, "signature.png");
  }
</script>

<Stack gap={5}>
  <SignaturePad bind:this={pad} bind:value labelText="Signature" />
  <ButtonSet>
    <Button
      kind="tertiary"
      size="small"
      disabled={!value}
      on:click={downloadSvg}
    >
      Download SVG
    </Button>
    <Button
      kind="tertiary"
      size="small"
      disabled={!value}
      on:click={downloadPng}
    >
      Download PNG
    </Button>
  </ButtonSet>
</Stack>
