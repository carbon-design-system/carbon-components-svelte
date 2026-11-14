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

  it("forwards only the download attributes to the hidden <img>", () => {
    const { document } = renderSSR(ImageLoader, {
      src,
      id: "logo",
      "data-testid": "logo",
      crossorigin: "anonymous",
      srcset: `${src} 2x`,
    });

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).not.toHaveAttribute("id");
    expect(img).not.toHaveAttribute("data-testid");
    // These choose what the browser downloads. Without them the hidden
    // `<img>` fetches `src` and the shown one the `srcset` candidate.
    expect(img).toHaveAttribute("crossorigin", "anonymous");
    expect(img).toHaveAttribute("srcset", `${src} 2x`);
    expect(document.querySelectorAll("#logo")).toHaveLength(0);
    expect(document.querySelectorAll("img")).toHaveLength(1);
  });

  it("renders no <img> without a src", () => {
    const { document } = renderSSR(ImageLoader, {});

    expect(document.querySelector("img")).toBeNull();
  });
});
