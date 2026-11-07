<script>
  import { FilePreview, Stack } from "carbon-components-svelte";

  // Built here so the example needs no files: a one-page PDF and a one-second tone.
  function makePdf() {
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

  function makeTone() {
    const rate = 8000;
    const samples = new Int16Array(rate);
    for (let i = 0; i < rate; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / rate) * 3000;
    }
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const write = (offset, text) =>
      [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
    write(0, "RIFF");
    view.setUint32(4, 36 + samples.byteLength, true);
    write(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples.byteLength, true);
    return new File([header, samples], "voicemail-0412.wav", {
      type: "audio/wav",
    });
  }

  const pdf = makePdf();
  const tone = makeTone();
</script>

<Stack gap={6}>
  <FilePreview file={pdf} />
  <FilePreview file={tone} />
</Stack>
