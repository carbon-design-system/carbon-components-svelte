import { createMemoryFileSystem } from "carbon-components-svelte";

declare global {
  interface Window {
    /** The fixture's adapter, for tests that count its calls. */
    __fm?: { adapter: ReturnType<typeof createMemoryFileSystem> };
    /** Events the fixture heard, as `name: detail`. */
    __fmLog?: string[];
  }
}

const COLORS = [
  "#6929c4",
  "#1192e8",
  "#005d5d",
  "#9f1853",
  "#fa4d56",
  "#570408",
];

/** A small SVG picture as a data URL, so a thumbnail needs no file. */
export function swatch(index: number, label = ""): string {
  const color = COLORS[index % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="${color}"/><text x="80" y="66" font-size="20" fill="#fff" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface SeedOptions {
  /** Files in `/Big`, for the 10k case. */
  big?: number;
  /** Siblings under `/Wide`, for the 2k folder tree. */
  wide?: number;
  latency?: number;
  failList?: string;
  failUpload?: string;
}

const DAY = 86_400_000;

export function createSeed(options: SeedOptions = {}) {
  const now = Date.UTC(2026, 10, 1);
  const entries: Array<Record<string, unknown>> = [
    { path: "/Documents/Reports/2026", kind: "folder" },
    {
      path: "/Documents/Reports/q3.pdf",
      size: 482_113,
      type: "application/pdf",
      modified: now - 3 * DAY,
      owner: "Ada",
      url: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9G",
    },
    {
      path: "/Documents/notes.txt",
      size: 120,
      type: "text/plain",
      modified: now - DAY,
      owner: "You",
      content: "Quarterly notes\n- ship the file manager\n- review the drafts",
    },
    {
      path: "/Documents/budget.csv",
      size: 2048,
      type: "text/csv",
      modified: now - 9 * DAY,
      owner: "Grace",
      content: "item,cost\nservers,1200\nlicenses,300",
    },
    {
      path: "/Projects/Alpha/readme.md",
      size: 900,
      type: "text/markdown",
      modified: now - 20 * DAY,
      owner: "You",
      content: "# Alpha",
    },
    { path: "/Projects/Beta", kind: "folder" },
    { path: "/Archive", kind: "folder" },
    { path: "/Deep/level-1/level-2/level-3/level-4/level-5", kind: "folder" },
    { path: "/Empty", kind: "folder" },
    {
      path: "/README.md",
      size: 300,
      type: "text/markdown",
      modified: now - 40 * DAY,
      owner: "You",
      content: "# Files",
    },
  ];
  for (let index = 0; index < 8; index++) {
    entries.push({
      path: `/Photos/image-${index + 1}.svg`,
      size: 20_000 + index * 5000,
      type: "image/svg+xml",
      modified: now - index * 2 * DAY,
      owner: index % 2 ? "Ada" : "You",
      url: swatch(index, `Photo ${index + 1}`),
    });
  }
  for (let index = 0; index < (options.big ?? 0); index++) {
    entries.push({
      path: `/Big/file-${String(index).padStart(5, "0")}.txt`,
      size: (index * 37) % 100_000,
      type: "text/plain",
      modified: now - (index % 365) * DAY,
      owner: index % 3 ? "Ada" : "Grace",
    });
  }
  for (let index = 0; index < (options.wide ?? 0); index++) {
    entries.push({
      path: `/Wide/folder-${String(index).padStart(4, "0")}`,
      kind: "folder",
    });
    if (index % 100 === 0) {
      entries.push({
        path: `/Wide/folder-${String(index).padStart(4, "0")}/inner`,
        kind: "folder",
      });
    }
  }
  return createMemoryFileSystem({
    entries: entries as never,
    latency: options.latency ?? 0,
    fail: (operation, path) => {
      if (
        operation === "list" &&
        options.failList &&
        path === options.failList
      ) {
        return new Error("The server refused the request.");
      }
      if (
        operation === "upload" &&
        options.failUpload &&
        path.endsWith(options.failUpload)
      ) {
        return new Error("The upload was rejected.");
      }
      return undefined;
    },
  });
}
