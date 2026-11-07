<script>
  import { FilePreview } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";
  import { onMount } from "svelte";

  // Every file is made here, at load, so the repo holds no binaries.
  const params = new URLSearchParams(location.search);
  const only = params.get("cases");

  // A script tag cannot close inside this block, so it is built.
  const CLOSE = "<" + "/script>";
  const MIB = 1024 * 1024;
  const encoder = new TextEncoder();

  function bytes(text) {
    return encoder.encode(text);
  }

  function png() {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 640, 360);
    gradient.addColorStop(0, "#0f62fe");
    gradient.addColorStop(1, "#8a3ffc");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 640, 360);
    context.fillStyle = "#ffffff";
    context.font = "48px sans-serif";
    context.fillText("Q3 capacity", 40, 190);
    return new Promise((resolve) =>
      canvas.toBlob(
        (blob) =>
          resolve(new File([blob], "capacity-q3.png", { type: "image/png" })),
        "image/png",
      ),
    );
  }

  function pdf() {
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      "<< /Length 44 >>\nstream\nBT /F1 18 Tf 30 100 Td (Invoice 2291) Tj ET\nendstream",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];
    let body = "%PDF-1.4\n";
    const offsets = [];
    objects.forEach((object, index) => {
      offsets.push(body.length);
      body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = body.length;
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      body += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new File([body], "invoice-2291.pdf", { type: "application/pdf" });
  }

  function wav() {
    const rate = 8000;
    const samples = rate;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    const write = (offset, text) =>
      [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
    write(0, "RIFF");
    view.setUint32(4, 36 + samples * 2, true);
    write(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples * 2, true);
    return new File([buffer], "voicemail.wav", { type: "audio/wav" });
  }

  function csv(rows) {
    let text = "ticket,region,owner,status,opened\n";
    for (let i = 1; i <= rows; i++) {
      text += `INC-${1000 + i},us-east-${(i % 3) + 1},"Ng, Dana",${i % 4 ? "open" : "closed"},2026-10-${String((i % 28) + 1).padStart(2, "0")}\n`;
    }
    return new File([text], "tickets.csv", { type: "text/csv" });
  }

  const code = `import { writable } from "svelte/store";

// Keep the last 50 deploys, newest first.
export const deploys = writable<Deploy[]>([]);

export function record(deploy: Deploy) {
  deploys.update((all) => [deploy, ...all].slice(0, 50));
}
`;

  const markdown = `# Runbook: failover

Switch **traffic** to the standby region, then confirm with \`curl\`.

- Check the [status page](https://status.example.com/)
- Page the on-call engineer
  - Include the incident id

> Do not skip the health check.

\`\`\`sh
./failover.sh --region eu-west-1
\`\`\`
`;

  const hostile = {
    markdown: `# Hostile

[click me](javascript:window.__xss=1) and <img src=x onerror="window.__xss=1"> and ![pixel](https://tracker.example/p.gif)

<script>window.__xss = 1${CLOSE}`,
    html: `<!doctype html><script>window.__xss = 1${CLOSE}<img src=x onerror="window.__xss=1"><h1>Report</h1>`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" onload="window.__xss=1"><script>window.__xss=1${CLOSE}<rect width="200" height="120" fill="#da1e28"/><text x="20" y="64" fill="#fff">SVG</text></svg>`,
  };

  const cases = {
    image: () => png(),
    pdf: () => pdf(),
    audio: () => wav(),
    code: () => new File([code], "deploys.ts", { type: "video/mp2t" }),
    csv: () => csv(500),
    markdown: () =>
      new File([markdown], "RUNBOOK.md", { type: "text/markdown" }),
    json: () =>
      new File(
        [
          '{"service":"billing","replicas":3,"regions":["us-east-1","eu-west-1"],"limits":{"cpu":"500m","id":12345678901234567890}}',
        ],
        "service.json",
        { type: "application/json" },
      ),
    zip: () =>
      new File([bytes("PK\u0003\u0004")], "backup.zip", {
        type: "application/zip",
      }),
    latin1: () =>
      new File(
        [
          new Uint8Array([
            0x43, 0x61, 0x66, 0xe9, 0x20, 0x72, 0xe9, 0x73, 0x75, 0x6d, 0xe9,
            0x0a,
          ]),
        ],
        "notes.txt",
        { type: "text/plain" },
      ),
    binaryAsText: async () => {
      const image = await png();
      return new File([image], "notes.txt", { type: "text/plain" });
    },
    arabic: () =>
      new File(["تقرير الحوادث\nالمنطقة: الشرق"], "تقرير.txt", {
        type: "text/plain",
      }),
    hostileMarkdown: () =>
      new File([hostile.markdown], "readme.md", { type: "text/markdown" }),
    hostileHtml: () =>
      new File([hostile.html], "page.html", { type: "text/html" }),
    hostileSvg: () =>
      new File([hostile.svg], "logo.svg", { type: "image/svg+xml" }),
    huge: () => {
      const line =
        "2026-11-07T10:15:00Z INFO request served path=/api/v1/orders status=200 ms=14\n";
      const chunk = line.repeat(Math.ceil(MIB / line.length));
      return new File(
        Array.from({ length: 50 }, () => chunk),
        "access.log",
        { type: "text/plain" },
      );
    },
  };

  const defaults = ["image", "code", "csv", "markdown", "json", "zip", "pdf"];
  const names = only ? only.split(",") : defaults;

  /** @type {Record<string, File>} */
  let files = {};
  let ready = false;

  onMount(async () => {
    const made = {};
    for (const name of names) made[name] = await cases[name]();
    files = made;
    ready = true;
  });
</script>

{#if ready}
  <div data-ready="true" style="display: grid; gap: 1rem; padding: 1rem">
    {#each names as name (name)}
      <FilePreview data-testid={name} file={files[name]} highlight={tokenize} />
    {/each}
  </div>
{/if}
