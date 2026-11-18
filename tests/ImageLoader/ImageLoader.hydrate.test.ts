// @vitest-environment node
// @depends-on src/ImageLoader/ImageLoader.svelte src/ImageLoader/ImageLoaderFrame.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const imageLoader = fileURLToPath(
  new URL("../../src/ImageLoader/ImageLoader.svelte", import.meta.url),
);

const src = "https://example.com/photo.jpg";

let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    { fixture: imageLoader, props: { src, alt: "Photo" } },
    {
      fixture: imageLoader,
      props: {
        src,
        alt: "Photo",
        ratio: "16x9",
        placeholder: "#8d8d8d",
        fit: "cover",
        focalPoint: "30% 20%",
      },
    },
    {
      fixture: imageLoader,
      props: {
        src,
        alt: "Photo",
        width: 800,
        height: 600,
        srcset: `${src} 1x, https://example.com/photo@2x.jpg 2x`,
        sources: [
          { srcset: "https://example.com/photo.avif", type: "image/avif" },
        ],
      },
    },
  ]);
}, 120_000);

// Svelte puts `onload` and `onerror` replay hooks on a server `<img>` and
// removes them on hydration. They are the one expected difference.
const withoutReplayHooks = (diff: HydrateResult["diffIgnoringIds"]) =>
  diff.filter(
    (entry) =>
      !(
        entry.kind === "attr-removed" &&
        /^on(load|error)=this\.__e=event$/.test(String(entry.before))
      ),
  );

// The server renders the loading state and a hidden <img> the browser can
// start fetching. Hydration must keep those nodes and add nothing, or the
// page would flash as the component takes over.
it.each([
  ["a plain image", 0],
  ["a placeholder, fit and focal point", 1],
  ["an image with srcset, sources and dimensions", 2],
])("hydrates %s without replacing the server markup", (_, index) => {
  const result = results[index];

  expect(result.hydrateError).toBeUndefined();
  expect(result.errors).toEqual([]);
  expect(result.identity.pct).toBe(100);
  expect(withoutReplayHooks(result.diffIgnoringIds)).toEqual([]);
});
