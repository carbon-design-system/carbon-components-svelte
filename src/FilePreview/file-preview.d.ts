import type { ComponentType, SvelteComponent } from "svelte";

export type FileKind =
  "image" | "pdf" | "video" | "audio" | "markdown" | "json" | "csv" | "text";

/**
 * A renderer component takes `file` and `options` props, and dispatches
 * `ready` once it shows the file, or `fallback` with `{ reason }`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a renderer has its own props beyond `file` and `options`.
export type RendererComponent = ComponentType<SvelteComponent<any>>;

export interface FilePreviewRenderer {
  /** A name for `load` events and for replacing a built-in. */
  id?: string;
  /**
   * Whether this renderer can show the file. `mime` is lowercase with no
   * parameters (empty when unknown); `name` is the file name.
   */
  match: (mime: string, name: string) => boolean;
  /** The renderer component. */
  component?: RendererComponent;
  /**
   * Loads the component on first use, such as
   * `() => import("./Viewer.svelte")`. Takes the place of `component`.
   */
  load?: () => Promise<{ default: RendererComponent }>;
  /** The most this renderer reads. Defaults to 1 MiB. */
  maxBytes?: number;
  /**
   * `true` when the renderer can show the start of a file, so a larger file
   * is cut at `maxBytes` instead of falling through to the next renderer.
   */
  partial?: boolean;
  /**
   * `true` for a renderer that streams from a URL (audio, video): it is
   * never read into memory, so `maxBytes` does not apply.
   */
  stream?: boolean;
}

/** What a renderer is given as its `file` prop. */
export interface PreviewFile {
  /** The bytes: the whole file, or its first `maxBytes` when `truncated`. */
  blob: Blob;
  /**
   * An object URL for `blob`, or the `src` itself for a streaming renderer.
   * Its type never lets opening it run the file. Revoked when the preview
   * goes.
   */
  url: string;
  name: string;
  /** Lowercase, no parameters, `""` when unknown. */
  mime: string;
  /** The whole file's size in bytes, when known. */
  size: number | undefined;
  /** `blob` is only the start of the file. */
  truncated: boolean;
}

export interface PreviewTexts {
  zoomIn: string;
  zoomOut: string;
  zoomFit: string;
  showMore: string;
  truncated: (
    shown: number,
    total: number | undefined,
    unit: "bytes" | "lines" | "rows",
  ) => string;
  encoding: (encoding: string) => string;
}

export type HighlightFunction = (
  code: string,
  language: string,
) => ReadonlyArray<{ type: string | null; text: string }> | undefined;

/** What a renderer is given as its `options` prop. */
export interface PreviewOptions {
  texts: PreviewTexts;
  highlight: HighlightFunction | undefined;
  locale: string | undefined;
}

export interface DecodedText {
  text: string;
  /** `utf-8`, `utf-16le`, `utf-16be` or `windows-1252`. */
  encoding: string;
  /** The bytes do not look like text; `text` is empty. */
  binary: boolean;
}

export interface ParsedCsv {
  rows: string[][];
  /** There were more rows than `maxRows`. */
  more: boolean;
  delimiter: string;
  /** The widest row, capped at `maxColumns`. */
  columns: number;
}

export const DEFAULT_MAX_BYTES: number;

/** The built-in renderers: image, pdf, video, audio, markdown, json, csv, text. */
export const defaultRenderers: ReadonlyArray<FilePreviewRenderer>;

export function normalizeMime(type: string | null | undefined): string;
export function extensionOf(name: string | null | undefined): string;

/**
 * What kind of file this is, from its MIME type and name. The MIME type
 * wins, except where it is generic or known to be wrong, where the
 * extension does.
 */
export function fileKind(
  mime: string | null | undefined,
  name: string | null | undefined,
): FileKind | undefined;

export function languageOf(
  mime: string | null | undefined,
  name: string | null | undefined,
): string | undefined;

export function highlightTokens(
  code: string,
  language: string | undefined,
  highlight: HighlightFunction | undefined,
): ReadonlyArray<{ type: string | null; text: string }>;

export function mergeRenderers(
  custom: ReadonlyArray<FilePreviewRenderer> | undefined,
): ReadonlyArray<FilePreviewRenderer>;

export function sameRenderers(
  a: ReadonlyArray<unknown> | undefined,
  b: ReadonlyArray<unknown> | undefined,
): boolean;

export function pickRenderer(
  renderers: ReadonlyArray<FilePreviewRenderer>,
  mime: string,
  name: string,
  size: number | undefined,
): { renderer?: FilePreviewRenderer; reason?: "unsupported" | "too-large" };

export function looksBinary(bytes: Uint8Array): boolean;
export function decodeText(bytes: Uint8Array, truncated?: boolean): DecodedText;
export function readBytes(blob: Blob): Promise<Uint8Array>;
export function revealBidi(text: string): string;
export function chunkEnd(
  text: string,
  from: number,
  maxLines?: number,
  maxChars?: number,
): number;
export function prettyJson(text: string, indent?: number): string | null;
export function sniffDelimiter(text: string): string;
export function parseCsv(
  text: string,
  options?: {
    delimiter?: string;
    maxRows?: number;
    maxColumns?: number;
    maxCell?: number;
  },
): ParsedCsv;
export function safeLink(href: string): string | undefined;
export function safeSource(src: string, base?: string): string | undefined;
export function nameFromUrl(src: string): string;
export function safeBlobType(
  mime: string,
  rendererId: string | undefined,
): string;
export function readCapped(
  response: Response,
  cap: number,
): Promise<{ blob: Blob; truncated: boolean }>;
