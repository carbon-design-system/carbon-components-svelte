// Generates `e2e/fixtures/public/media/clip.webm`: a tiny WebM test clip (VP9,
// no audio), 320x180, 8 s, 8 fps, with a keyframe every second.
// Usage: bun scripts/make-media-fixture.ts <ffmpeg> <out.webm>, where
// <ffmpeg> is the build Playwright downloads, such as
// ~/Library/Caches/ms-playwright/ffmpeg-1013/ffmpeg-mac.
// A bar moves across the frame and the hue shifts with time, so a seek is
// visible. Frames are drawn on a canvas in Chromium and encoded with the
// ffmpeg build Playwright downloads for recordings (mjpeg in, VP9 out).
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const ffmpeg = process.argv[2];
const out = process.argv[3];
const W = 320;
const H = 180;
const FPS = 8;
const SECONDS = 8;
const frames = FPS * SECONDS;

const browser = await chromium.launch();
const page = await browser.newPage();
const jpegs: Buffer[] = [];
for (let n = 0; n < frames; n++) {
  // biome-ignore lint/performance/noAwaitInLoops: one canvas, drawn in order
  const base64 = await page.evaluate(
    ({ n, frames, W, H }) => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const t = n / frames;
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, `hsl(${Math.round(210 - 160 * t)} 70% 35%)`);
      gradient.addColorStop(1, `hsl(${Math.round(260 - 160 * t)} 60% 20%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.floor(t * (W - 10)), 0, 10, H);
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(String(Math.floor(n / 8)).padStart(2, "0"), 20, 100);
      return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    },
    { n, frames, W, H },
  );
  jpegs.push(Buffer.from(base64, "base64"));
}
await browser.close();

const child = spawn(
  ffmpeg,
  [
    "-y",
    "-f",
    "image2pipe",
    "-framerate",
    String(FPS),
    "-c:v",
    "mjpeg",
    "-i",
    "pipe:0",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "30k",
    "-g",
    "8",
    "-pix_fmt",
    "yuv420p",
    "-deadline",
    "good",
    "-cpu-used",
    "5",
    out,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);
for (const jpeg of jpegs) child.stdin.write(jpeg);
child.stdin.end();
child.on("exit", (code) => process.exit(code ?? 0));
