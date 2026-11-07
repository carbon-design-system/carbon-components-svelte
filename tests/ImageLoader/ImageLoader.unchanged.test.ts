import { render } from "@testing-library/svelte";
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { canonicalChildren } from "./canonical";
import { settlePreload, stubPreloader } from "./preloader";

// The markup before `placeholder`, `placeholderSrc`, `fit`, `focalPoint`,
// `sources` and `srcset` existed, captured from that version. An image given
// none of them renders as it did: no `AspectRatio` for `width` and `height`,
// and no class or `height: auto` on the `<img>`.
const hidden =
  '<img alt="A" aria-hidden="true" src="a.jpg" style="display: none;"></img>';
const hiddenCors =
  '<img alt="A" aria-hidden="true" crossorigin="anonymous" src="a.jpg" style="display: none;"></img>';
const frame = (inner: string) =>
  `<div class="bx--aspect-ratio bx--aspect-ratio--16x9"><div class="bx--aspect-ratio--object">${inner}</div></div>`;

const cases: {
  name: string;
  props: Record<string, unknown>;
  loading: string;
  loaded: string;
}[] = [
  {
    name: "width and height",
    props: { width: 800, height: 600 },
    loading: hidden,
    loaded:
      '<img alt="A" height="600" src="a.jpg" style="width: 100%;" width="800"></img>',
  },
  {
    name: "width and height as strings, with rest props",
    props: {
      width: "800",
      height: "600",
      class: "photo",
      id: "p",
      "data-testid": "t",
    },
    loading: hidden,
    loaded:
      '<img alt="A" class="photo" data-testid="t" height="600" id="p" src="a.jpg" style="width: 100%;" width="800"></img>',
  },
  {
    name: "height only",
    props: { height: 600 },
    loading: hidden,
    loaded: '<img alt="A" height="600" src="a.jpg" style="width: 100%;"></img>',
  },
  {
    name: "a ratio with width and height",
    props: { ratio: "16x9", width: 800, height: 600 },
    loading: frame("") + hidden,
    loaded: frame(
      '<img alt="A" height="600" src="a.jpg" style="width: 100%;" width="800"></img>',
    ),
  },
  {
    name: "style and crossorigin",
    props: {
      style: "border-radius: 4px",
      width: 10,
      height: 10,
      crossorigin: "anonymous",
    },
    loading: hiddenCors,
    loaded:
      '<img alt="A" crossorigin="anonymous" height="10" src="a.jpg" style="border-radius: 4px; width: 100%;" width="10"></img>',
  },
];

describe("ImageLoader without the responsive and placeholder options", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    (Element.prototype as { animate?: unknown }).animate = undefined;
  });

  it.each(cases)(
    "renders as it did with $name",
    async ({ props, loading, loaded }) => {
      // Svelte 5 runs `transition:fade` through the Web Animations API.
      if (!Element.prototype.animate) {
        Element.prototype.animate = () => {
          const animation = {
            cancel() {},
            finish() {},
            pause() {},
            play() {},
            onfinish: null as (() => void) | null,
          };
          queueMicrotask(() => animation.onfinish?.());
          return animation as unknown as Animation;
        };
      }
      const preloads = stubPreloader();
      const { container } = render(ImageLoader, {
        props: { src: "a.jpg", alt: "A", ...props },
      });

      expect(canonicalChildren(container)).toBe(loading);

      await settlePreload(preloads[0], "onload");

      expect(canonicalChildren(container)).toBe(loaded);
    },
  );

  it("wraps the image only when an option needs a box", () => {
    stubPreloader();
    const sized = { width: 800, height: 600 };
    const wrapped = (extra: Record<string, unknown>) => {
      const { container, unmount } = render(ImageLoader, {
        props: { src: "a.jpg", alt: "A", ...sized, ...extra },
      });
      const has = !!container.querySelector(".bx--aspect-ratio");
      unmount();
      return has;
    };

    expect(wrapped({})).toBe(false);
    expect(wrapped({ srcset: "a.jpg 1x, b.jpg 2x" })).toBe(false);
    expect(
      wrapped({ sources: [{ srcset: "a.avif", type: "image/avif" }] }),
    ).toBe(false);
    expect(wrapped({ placeholder: true })).toBe(true);
    expect(wrapped({ placeholderSrc: "lqip.jpg" })).toBe(true);
    expect(wrapped({ fit: "cover" })).toBe(true);
    expect(wrapped({ focalPoint: "30% 20%" })).toBe(true);
  });
});
