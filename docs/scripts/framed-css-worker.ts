/**
 * Trims the theme sheet for one framed page at a time, off the build's
 * thread: `framed-css.ts` runs a few of these on a cold build.
 */
import { optimizeCarbonCss } from "carbon-preprocess-svelte";

declare const self: Worker;

type Job = {
  id: number;
  components: string[];
  safelist: string[];
  cwd: string;
};

let carbonCss = "";

self.onmessage = async ({ data }: MessageEvent<{ css: string } | Job>) => {
  if ("css" in data) {
    carbonCss = data.css;
    return;
  }
  const { css } = await optimizeCarbonCss(carbonCss, {
    components: data.components,
    safelist: data.safelist,
    cwd: data.cwd,
    preserveAllIBMFonts: true,
  });
  self.postMessage({ id: data.id, css });
};
