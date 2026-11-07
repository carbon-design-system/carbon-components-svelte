// @vitest-environment node
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { renderSSR } from "../utils/ssr";

const src = "https://example.com/logo.svg";

describe("ImageLoader server render", () => {
  it("renders an <img> with src and alt when src is set", () => {
    const { document } = renderSSR(ImageLoader, { src, alt: "Logo" });

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", src);
    expect(img).toHaveAttribute("alt", "Logo");
  });

  it("keeps the server <img> out of the layout while loading", () => {
    const { document } = renderSSR(ImageLoader, { src });

    expect(document.querySelector("img")).toHaveStyle({ display: "none" });
  });

  it("marks the server <img> lazy in lazy mode", () => {
    const { document } = renderSSR(ImageLoader, { src, lazy: true });

    expect(document.querySelector("img")).toHaveAttribute("loading", "lazy");
  });

  it("renders the <img> when an aspect ratio is set", () => {
    const { document } = renderSSR(ImageLoader, { src, ratio: "16x9" });

    expect(document.querySelector("img")).toHaveAttribute("src", src);
  });

  it("forwards only the attributes that choose the file to the hidden <img>", () => {
    const { document } = renderSSR(ImageLoader, {
      src,
      id: "logo",
      "data-testid": "logo",
      crossorigin: "anonymous",
      referrerpolicy: "no-referrer",
      fetchpriority: "high",
      decoding: "async",
      srcset: `${src} 1x, https://example.com/logo@2x.svg 2x`,
      sizes: "100vw",
    });

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).not.toHaveAttribute("id");
    expect(img).not.toHaveAttribute("data-testid");
    expect(img).toHaveAttribute("crossorigin", "anonymous");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute(
      "srcset",
      `${src} 1x, https://example.com/logo@2x.svg 2x`,
    );
    expect(img).toHaveAttribute("sizes", "100vw");
    expect(document.querySelectorAll("#logo")).toHaveLength(0);
    expect(document.querySelectorAll("img")).toHaveLength(1);
  });

  it("renders sources in a <picture> ahead of the hidden <img>", () => {
    const { document } = renderSSR(ImageLoader, {
      src,
      sources: [
        { srcset: "logo.avif", type: "image/avif" },
        {
          srcset: "logo-wide.webp",
          type: "image/webp",
          media: "(min-width: 800px)",
        },
      ],
    });

    const picture = document.querySelector("picture");
    assert(picture);
    const children = Array.from(picture.children);
    expect(children.map((child) => child.tagName)).toEqual([
      "SOURCE",
      "SOURCE",
      "IMG",
    ]);
    expect(children[1]).toHaveAttribute("media", "(min-width: 800px)");
    expect(children[1]).toHaveAttribute("type", "image/webp");
  });

  it("reserves the box from width and height", () => {
    const { document } = renderSSR(ImageLoader, {
      src,
      width: 800,
      height: 600,
    });

    const frame = document.querySelector(".bx--aspect-ratio");
    expect(frame).toHaveClass("bx--aspect-ratio--custom");
    expect(frame).toHaveStyle({ "--ccs-aspect-ratio": "75.000%" });
  });

  it("renders the placeholder in the server HTML", () => {
    const { document } = renderSSR(ImageLoader, {
      src,
      ratio: "16x9",
      placeholder: "#8d8d8d",
    });

    const placeholder = document.querySelector(
      ".bx--image-loader__placeholder",
    );
    assert(placeholder);
    expect(placeholder).toHaveStyle({ "--ccs-image-placeholder": "#8d8d8d" });
    expect(placeholder).not.toHaveClass("bx--image-loader__placeholder--done");
  });

  it("renders no <img> without a src", () => {
    const { document } = renderSSR(ImageLoader, {});

    expect(document.querySelector("img")).toBeNull();
  });
});
