---
components: ["FilePreview"]
description: File preview shows a file or URL by its type: an image, text and code, a table, JSON, Markdown, a PDF, audio or video, or a file card with a download when there is no preview.
keywords: ["attachment", "viewer", "document", "pdf"]
---

<script>
  import { FilePreview, Stack } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const code = `export function record(deploy) {
  deploys.update((all) => [deploy, ...all].slice(0, 50));
}
`;

  const tickets = new File(
    ["ticket,region,owner,status\nINC-1001,us-east-1,Dana Ng,open\nINC-1002,eu-west-1,Sam Ortiz,closed\nINC-1003,ap-south-1,Dana Ng,open\n"],
    "tickets.csv",
    { type: "text/csv" },
  );

  const config = new File(
    ['{"service":"billing","replicas":3,"limits":{"cpu":"500m","memory":"256Mi"}}'],
    "billing.json",
    { type: "application/json" },
  );

  const runbook = new File(
    ["# Failover\n\nSwitch **traffic** to the standby region, then confirm with `curl`.\n\n- Check the [status page](https://status.example.com/)\n- Page the on-call engineer\n"],
    "RUNBOOK.md",
    { type: "text/markdown" },
  );

  const diagram = new File(
    ['<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#0f62fe"/><text x="24" y="100" fill="#fff" font-size="28">Q3 capacity</text></svg>'],
    "capacity-q3.svg",
    { type: "image/svg+xml" },
  );

  const archive = new File(["PK"], "heap-dump.zip", { type: "application/zip" });
</script>

## Basic

Pass a `File` or `Blob` as `file`. The preview picks a renderer from the file's MIME type and name, reads the bytes in the browser, and shows them under a header with the name, type, size, a download button and a full screen button. Nothing is uploaded.

<FilePreview text={code} name="deploys.js" highlight={tokenize} />

## Types

Each type has its own renderer. A file's own MIME type wins over its extension, except where it is generic (`application/octet-stream`) or known to be wrong: a `.csv` that Windows types as `application/vnd.ms-excel` is still a table, and a `.ts` that the OS types as `video/mp2t` is still source.

### Text and code

Pass `highlight` a tokenizer such as `tokenize` from `carbon-components-svelte/syntax` to color source, and load `css/syntax.css` and `css/syntax-tokens.css` as for [CodeSnippet](/components/CodeSnippet#syntax-highlighting). Core does not import `syntax`, so an app that never previews code does not load it. Without `highlight`, source is plain.

Text shows a chunk at a time, with "Show more" for the rest, and reads at most 1 MiB of a file however large it is. Text that is not UTF-8 is read as Windows-1252, and the preview says so.

<FilePreview text={code} name="deploys.js" highlight={tokenize} />

### CSV and TSV

The first row is the header. The delimiter is the comma, tab, semicolon or pipe that the first line uses most, and quoted fields can hold delimiters and line breaks. A table shows 100 rows at a time.

<FilePreview file={tickets} />

### JSON

JSON is re-indented as text, so a number keeps every digit and a key keeps its place. Invalid JSON is shown as it is.

<FilePreview file={config} highlight={tokenize} />

### Markdown

Markdown covers headings, paragraphs, lists, quotes, rules, code, emphasis and links. It is read to data and drawn as elements: HTML in the file is text, images show their alt text and load nothing, and only `http`, `https` and `mailto` links link, with `rel="noopener noreferrer nofollow"`. For a fuller reader, use Markdown.

<FilePreview file={runbook} />

### Images

An image has zoom buttons under it. When the image has focus, <DocKbd label="+" /> and <DocKbd label="-" /> zoom and <DocKbd label="0" /> fits it to the box. An SVG is drawn through an `img`, so its scripts do not run.

<FilePreview file={diagram} />

### PDF, audio and video

A PDF opens in the browser's viewer, in a frame; audio and video play in native controls. Audio and video stream, so a large file is never read into memory. Where a browser cannot show a PDF in a frame, as phones usually cannot, the download button is the way in.

<FileSource src="/framed/FilePreview/FilePreviewBinary" />

### Unknown types

A file with no renderer, or one that is too large, shows a card with a reason and a download.

<FilePreview file={archive} />

## Sources

Set one of `file`, `text` or `src`. `file` and `text` take precedence over `src`.

`src` fetches a URL. The server must allow it with CORS; when the fetch fails the preview shows the file card with a link to the URL, and `load:error` reports `"failed"`. The exception is audio and video, which play from a URL the page cannot fetch. Set `requestInit` for headers or credentials. Only `http`, `https`, `blob` and `data` URLs load. The fetch is aborted when `src` changes, and a late answer to an older request is ignored.

```svelte
<FilePreview src="/attachments/invoice-2291.pdf" />
<FilePreview src={url} name="export.csv" type="text/csv" requestInit={{ credentials: "include" }} />
```

Set `name` or `type` when the source does not say, such as a bare `Blob`, or a URL with no extension and no `Content-Type`.

## Size limits

The limit is checked before any bytes are read, and a renderer reads no more than its `maxBytes`. A `src` is read as a stream and cancelled at the limit.

| Type | Reads at most | Over the limit |
| --- | --- | --- |
| Text and code | 1 MiB | Shows the start, with a note |
| CSV and TSV | 2 MiB | Shows the first rows, with a note |
| Markdown | 512 KiB | Shows the start, with a note |
| JSON | 2 MiB | Shows the start as source text |
| Image | 20 MiB | File card, "too large" |
| PDF | 25 MiB | File card, "too large" |
| Audio and video | None | Streams; never read into memory |

## Custom renderers

Pass `renderers` to try your own before the built-in ones. Each one has a `match(mime, name)` function and either a `component` or a `load` function that imports it on first use, so a renderer costs nothing until a matching file is previewed. Give a renderer the `id` of a built-in to replace it.

A renderer component takes `file` (the bytes as `blob`, an object URL as `url`, `name`, `mime`, `size` and `truncated`) and `options`. It dispatches `ready` when the file is shown, or `fallback` with a `reason` when it cannot show it.

<FileSource src="/framed/FilePreview/CustomRenderer" />

## Layout

The preview area is as tall as its content, up to `height` (24rem unless the page sets `--ccs-file-preview-height`). Text and tables scroll past it; images, PDFs and video fill it. The full screen button uses the browser's Fullscreen API and is left out where there is none, as on iPhone. Bind `fullscreen` to follow it.

Set `hideHeader` to leave out the header. The region keeps the file name as its label.

## Examples

### Attachment list

Pick an attachment to preview it beside the list. Keying the preview on the selection starts a new one, which aborts any fetch the last one had.

<FileSource src="/framed/FilePreview/AttachmentList" />

### Upload confirmation

Show the chosen file before it is uploaded, so a person can see it is the right one.

<FileSource src="/framed/FilePreview/UploadConfirmation" />

## Accessibility

The preview is a `region` named by the file name. A consumer `aria-label` replaces it. While a file loads the region has `aria-busy="true"`, and a fallback is announced in a polite live region. Each renderer has its own semantics: an image has the file name as its alt text, a table has column headers, a scrollable text, table or document area is a focusable group so the keyboard can scroll it, and the PDF frame is titled with the file name. The download link is always there, in the header while a preview shows and on the card when there is none.

| Key | Action |
| --- | --- |
| <DocKbd label="Tab" /> | Move through the buttons, and into a scrollable area |
| <DocKbd label="↑" /> <DocKbd label="↓" /> | Scroll a focused area |
| <DocKbd label="+" /> <DocKbd label="-" /> <DocKbd label="0" /> | Zoom an image in, out and to fit |
| <DocKbd label="Esc" /> | Leave full screen |

## Security

A file is untrusted input, and the preview treats it that way.

| Rule | Why |
| --- | --- |
| Text is never interpreted as HTML. | An HTML file is shown as its source. Nothing in the preview uses `{@html}` or `innerHTML`. |
| An SVG is drawn through an `img`. | An image document runs no script, and loads no other resources. Inline SVG would run its script. |
| Markdown is read to data, and links are checked. | Raw HTML is text, images load nothing, and only `http`, `https` and `mailto` links link, with no credentials in the URL. |
| Object URLs get a type that cannot run the file. | The download link is `application/octet-stream`, so "open in a new tab" downloads, and an HTML or SVG file never runs in your origin. Only the image and PDF renderers get `image/*` and `application/pdf`. |
| A PDF must start with `%PDF-` before it is framed. | A file that says it is a PDF and is not never reaches the frame. |
| Object URLs are revoked when the preview changes or goes. | A blob URL holds the file in memory until it is revoked. |
| The limit is checked before reading. | A 50 MB file costs at most the renderer's `maxBytes`. |
| Bidirectional control characters in source are shown as `U+202E`. | They can reorder source so that it reads differently than it runs. |

The PDF frame has no `sandbox`. Chromium refuses to open its PDF viewer in a sandboxed frame, whatever the sandbox value, so the frame relies on the checks above and on the viewer's own isolation instead.

## Server rendering

On the server the preview renders the header and the file card with its spinner, and the download link for a `src`. The file is read and shown after mount.
