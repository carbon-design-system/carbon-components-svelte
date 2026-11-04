// @depends-on e2e/fixtures/public/media/*
import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Real media: `public/media/clip.webm` is 8 seconds of VP9 with a keyframe
// every second, and the audio fixture builds a 4 second WAV in the page.
// Nothing here uses the network. WebKit cannot decode every WebM build, so
// the playback cases skip where the clip does not load.

const video = (page: Page) => page.getByTestId("video");
const media = (page: Page) => video(page).locator("video");
const scrubber = (page: Page) =>
  video(page).getByRole("slider", { name: "Seek" });

async function open(page: Page) {
  await page.goto("/media-player.html");
  await expect(video(page)).toBeVisible();
  const loaded = await media(page).evaluate(
    (el: HTMLVideoElement) =>
      new Promise<boolean>((resolve) => {
        if (el.readyState >= 1) return resolve(true);
        el.addEventListener("loadedmetadata", () => resolve(true), {
          once: true,
        });
        el.addEventListener("error", () => resolve(false), { once: true });
      }),
  );
  test.skip(!loaded, "this browser cannot decode the WebM clip");
}

const time = (page: Page) =>
  media(page).evaluate((el: HTMLVideoElement) => el.currentTime);

async function seekTo(page: Page, seconds: number) {
  await media(page).evaluate((el: HTMLVideoElement, t) => {
    el.currentTime = t;
  }, seconds);
}

async function focusScrubber(page: Page) {
  await scrubber(page).focus();
}

async function pressOnPlayer(page: Page, key: string) {
  await video(page).evaluate((el: HTMLElement) => el.focus());
  await page.keyboard.press(key);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("no box");
  return rect;
}

test.describe("MediaPlayer", () => {
  test("shows the length, chapters and a spoken position on the scrubber", async ({
    page,
  }) => {
    await open(page);
    await expect(scrubber(page)).toHaveAttribute("aria-valuemax", "8");
    await expect(scrubber(page)).toHaveAttribute(
      "aria-valuetext",
      "0 seconds of 8 seconds, Introduction",
    );
    await expect(
      video(page).locator(".bx--media-scrubber__chapter"),
    ).toHaveCount(2);
    await expect(
      video(page).locator(".bx--media-scrubber__buffered").first(),
    ).toBeVisible();
    await expect(video(page).locator(".bx--media-player__time")).toHaveText(
      "0:00 / 0:08",
    );
  });

  test("plays and pauses from the button, the surface and the K key", async ({
    page,
  }) => {
    await open(page);
    await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .click();
    await expect(page.getByTestId("bound")).toContainText("playing");
    await media(page).click({ position: { x: 100, y: 60 } });
    await expect(page.getByTestId("bound")).toContainText("paused");
    await pressOnPlayer(page, "k");
    await expect(page.getByTestId("bound")).toContainText("playing");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("bound")).toContainText("paused");
  });

  test("moves the position from the scrubber's keys", async ({ page }) => {
    await open(page);
    await focusScrubber(page);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => time(page)).toBeCloseTo(5, 0);
    await page.keyboard.press("PageDown");
    await expect.poll(() => time(page)).toBeCloseTo(4.2, 0);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Home");
    await expect.poll(() => time(page)).toBe(0);
    await page.keyboard.press("End");
    await expect.poll(() => time(page)).toBeCloseTo(8, 0);
    await expect(scrubber(page)).toHaveAttribute(
      "aria-valuetext",
      "8 seconds of 8 seconds, Wrap-up",
    );
  });

  test("seeks where the track is pressed and keeps the thumb under a drag", async ({
    page,
  }) => {
    await open(page);
    const track = await box(video(page).locator(".bx--media-scrubber__track"));
    const y = track.y + track.height / 2;
    await page.mouse.move(track.x + track.width * 0.25, y);
    await expect(
      video(page).locator(".bx--media-scrubber__preview"),
    ).toContainText("0:02");
    await page.mouse.down();
    await page.mouse.move(track.x + track.width * 0.75, y, { steps: 4 });
    // Playing while the thumb is held: the clock keeps ticking, and the
    // thumb stays where the pointer is.
    await media(page).evaluate((el: HTMLVideoElement) => el.play());
    await page.waitForTimeout(700);
    await expect(scrubber(page)).toHaveAttribute("aria-valuenow", "6");
    await page.mouse.up();
    await expect.poll(() => time(page)).toBeGreaterThanOrEqual(6);
    await expect(scrubber(page)).toBeFocused();
  });

  test("changes the speed from the menu and the < and > keys", async ({
    page,
  }) => {
    await open(page);
    await video(page)
      .getByRole("button", { name: /Playback speed/ })
      .click();
    const item = page.getByRole("menuitemradio", { name: "1.5×" });
    await item.click();
    await expect
      .poll(() =>
        media(page).evaluate((el: HTMLVideoElement) => el.playbackRate),
      )
      .toBe(1.5);
    await expect(page.getByTestId("bound")).toContainText("1.5");
    await pressOnPlayer(page, ">");
    await expect
      .poll(() =>
        media(page).evaluate((el: HTMLVideoElement) => el.playbackRate),
      )
      .toBe(1.75);
    await page.keyboard.press("<");
    await page.keyboard.press("<");
    await expect
      .poll(() =>
        media(page).evaluate((el: HTMLVideoElement) => el.playbackRate),
      )
      .toBe(1.25);
  });

  test("switches caption tracks from the menu and the C key", async ({
    page,
  }) => {
    await open(page);
    const modes = () =>
      media(page).evaluate((el: HTMLVideoElement) =>
        Array.from(el.textTracks).map((t) => `${t.kind}:${t.mode}`),
      );
    await video(page)
      .getByRole("button", { name: "Captions", exact: true })
      .click();
    await page.getByRole("menuitemradio", { name: "English" }).click();
    await expect
      .poll(modes)
      .toEqual(["captions:showing", "subtitles:disabled", "chapters:hidden"]);
    await video(page)
      .getByRole("button", { name: "Captions", exact: true })
      .click();
    await page.getByRole("menuitemradio", { name: "Español" }).click();
    await expect
      .poll(modes)
      .toEqual(["captions:disabled", "subtitles:showing", "chapters:hidden"]);
    await pressOnPlayer(page, "c");
    await expect
      .poll(modes)
      .toEqual(["captions:disabled", "subtitles:disabled", "chapters:hidden"]);
    await page.keyboard.press("c");
    await expect
      .poll(modes)
      .toEqual(["captions:disabled", "subtitles:showing", "chapters:hidden"]);
  });

  test("mutes and sets the volume from the button, the slider and keys", async ({
    page,
  }) => {
    await open(page);
    await pressOnPlayer(page, "m");
    await expect(page.getByTestId("bound")).toContainText("true");
    await video(page)
      .getByRole("button", { name: "Unmute", exact: true })
      .click();
    await expect(page.getByTestId("bound")).toContainText("false");
    await video(page).getByRole("slider", { name: "Volume" }).fill("40");
    await expect(page.getByTestId("bound")).toContainText("0.40");
    await pressOnPlayer(page, "ArrowUp");
    await expect(page.getByTestId("bound")).toContainText("0.45");
  });

  test("skips with J and L, and the arrow keys on the player", async ({
    page,
  }) => {
    await open(page);
    await seekTo(page, 4);
    await pressOnPlayer(page, "l");
    await expect.poll(() => time(page)).toBeCloseTo(8, 0);
    await page.keyboard.press("j");
    await expect.poll(() => time(page)).toBeCloseTo(0, 0);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => time(page)).toBeCloseTo(5, 0);
  });

  test("leaves the keys to a text field, a menu and a focused button", async ({
    page,
  }) => {
    await open(page);
    await video(page).evaluate((el) => {
      const input = document.createElement("input");
      input.setAttribute("aria-label", "Note");
      el.append(input);
    });
    await video(page).getByLabel("Note").focus();
    await page.keyboard.type("kmf");
    await expect(page.getByTestId("bound")).toContainText("paused");
    await expect(page.getByTestId("bound")).toContainText("false");

    await video(page)
      .getByRole("button", { name: /Playback speed/ })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("m");
    await page.keyboard.press("k");
    await expect(page.getByTestId("bound")).toContainText("paused");
    await expect(page.getByTestId("bound")).toContainText("false");
    await page.keyboard.press("Escape");

    // Space on a focused button presses it once, not twice.
    await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("bound")).toContainText("playing");
  });

  test("shows the shortcuts in a dialog and returns focus on Escape", async ({
    page,
  }) => {
    await open(page);
    const button = video(page).getByRole("button", {
      name: "Keyboard shortcuts",
    });
    await button.focus();
    await page.keyboard.press("Enter");
    const dialog = video(page).getByRole("dialog", {
      name: "Keyboard shortcuts",
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Close", exact: true }),
    ).toBeFocused();
    await expect(dialog.locator("dt")).toHaveCount(13);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
    await pressOnPlayer(page, "?");
    await expect(dialog).toBeVisible();
  });

  test("hides the controls while playing and shows them for the pointer and the keyboard", async ({
    page,
  }) => {
    await open(page);
    // The clip is shorter than the test; end of media would show the controls.
    await media(page).evaluate((el: HTMLVideoElement) => {
      el.loop = true;
    });
    const root = video(page);
    await root.getByRole("button", { name: "Play", exact: true }).click();
    await page.mouse.move(5, 5);
    await expect(root).toHaveClass(/bx--media-player--controls-hidden/);
    await page.mouse.move(100, 100);
    await expect(root).not.toHaveClass(/bx--media-player--controls-hidden/);
    await page.mouse.move(5, 5);
    await expect(root).toHaveClass(/bx--media-player--controls-hidden/);
    // Focus by keyboard inside the controls keeps them up. A key press and
    // a focus, since Safari's Tab skips buttons unless its setting is on.
    await page.keyboard.press("Shift");
    await root.getByRole("button", { name: "Mute", exact: true }).focus();
    await expect(root).not.toHaveClass(/bx--media-player--controls-hidden/);
    await page.waitForTimeout(1200);
    await expect(root).not.toHaveClass(/bx--media-player--controls-hidden/);
    // Never while paused.
    await root.getByRole("button", { name: "Pause", exact: true }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1200);
    await expect(root).not.toHaveClass(/bx--media-player--controls-hidden/);
  });

  test("keeps the controls up when the user prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1400);
    await expect(video(page)).not.toHaveClass(
      /bx--media-player--controls-hidden/,
    );
  });

  test("settles on the last seek after a burst of seeks while playing", async ({
    page,
  }) => {
    await open(page);
    await media(page).evaluate((el: HTMLVideoElement) => el.play());
    await focusScrubber(page);
    // Each seek lands before the last one is done. The player must not stop
    // on an earlier one, or leave the thumb away from the media.
    for (const key of [
      "End",
      "Home",
      "ArrowRight",
      "End",
      "PageDown",
      "Home",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: the keys go in order
      await page.keyboard.press(key);
    }
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await media(page).evaluate((el: HTMLVideoElement) => el.pause());
    await expect
      .poll(() => media(page).evaluate((el: HTMLVideoElement) => el.seeking))
      .toBe(false);
    const now = await time(page);
    expect(now).toBeGreaterThan(7);
    const valuenow = Number(await scrubber(page).getAttribute("aria-valuenow"));
    expect(Math.abs(valuenow - now)).toBeLessThan(0.6);
  });

  test("goes fullscreen with the controls and leaves again", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit needs a real gesture here");
    await open(page);
    await video(page)
      .getByRole("button", { name: "Fullscreen", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.fullscreenElement?.getAttribute("data-testid"),
        ),
      )
      .toBe("video");
    await expect(
      video(page).getByRole("button", { name: "Exit fullscreen" }),
    ).toBeVisible();
    // The speed menu opens inside the player, so it shows in fullscreen.
    await video(page)
      .getByRole("button", { name: /Playback speed/ })
      .click();
    await expect(
      video(page).getByRole("menuitemradio", { name: "2×" }),
    ).toBeVisible();
    await video(page)
      .getByRole("button", { name: /Playback speed/ })
      .click();
    await video(page).getByRole("button", { name: "Exit fullscreen" }).click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page);
    const check = async () => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    };
    await check();
    await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .click();
    await check();
    await video(page)
      .getByRole("button", { name: "Captions", exact: true })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await check();
    await page.keyboard.press("Escape");
    await pressOnPlayer(page, "?");
    await expect(video(page).getByRole("dialog")).toBeVisible();
    await check();
  });

  test("has no detectable accessibility violations in Gray 100", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("MediaPlayer audio", () => {
  test("is a compact bar with no picture, fullscreen or auto-hide", async ({
    page,
  }) => {
    await open(page);
    const audio = page.getByTestId("audio");
    await expect(audio.locator("video")).toHaveCount(0);
    await expect(
      audio.getByRole("button", { name: "Fullscreen", exact: true }),
    ).toHaveCount(0);
    await expect(audio.getByRole("slider", { name: "Seek" })).toHaveAttribute(
      "aria-valuemax",
      "4",
    );
    const bar = await box(audio);
    expect(bar.height).toBeLessThan(80);
    await audio.getByRole("button", { name: "Play", exact: true }).click();
    await expect(
      audio.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(audio).not.toHaveClass(/bx--media-player--controls-hidden/);
  });
});

test.describe("MediaPlayer RTL", () => {
  test("mirrors the buttons and keeps the timeline running left to right", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const root = await box(video(page));
    const play = await box(
      video(page).getByRole("button", { name: "Play", exact: true }),
    );
    const fullscreen = await box(
      video(page).getByRole("button", { name: "Fullscreen", exact: true }),
    );
    expect(play.x).toBeGreaterThan(root.x + root.width / 2);
    expect(fullscreen.x).toBeLessThan(root.x + root.width / 2);

    await expect(video(page).locator(".bx--media-scrubber")).toHaveAttribute(
      "dir",
      "ltr",
    );
    await focusScrubber(page);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => time(page)).toBeCloseTo(5, 0);
    const thumb = await box(video(page).locator(".bx--media-scrubber__thumb"));
    const track = await box(video(page).locator(".bx--media-scrubber__track"));
    expect(thumb.x + thumb.width / 2).toBeCloseTo(
      track.x + track.width * (5 / 8),
      0,
    );
  });
});

test.describe("MediaPlayer forced colors", () => {
  test("keeps the controls on a Canvas strip and the track in system colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    const read = (selector: string) =>
      video(page)
        .locator(selector)
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return { background: s.backgroundColor, color: s.color };
        });
    const probe = await page.evaluate(() => {
      const el = document.createElement("div");
      document.body.append(el);
      const out: Record<string, string> = {};
      for (const name of [
        "Canvas",
        "CanvasText",
        "GrayText",
        "Highlight",
        "ButtonText",
      ]) {
        el.style.backgroundColor = name;
        out[name] = getComputedStyle(el).backgroundColor;
      }
      el.remove();
      return out;
    });
    expect((await read(".bx--media-player__controls")).background).toBe(
      probe.Canvas,
    );
    expect((await read(".bx--media-scrubber__track")).background).toBe(
      probe.GrayText,
    );
    expect((await read(".bx--media-scrubber__filled")).background).toBe(
      probe.Highlight,
    );
    expect((await read(".bx--media-player__button")).color).toBe(
      probe.ButtonText,
    );
    // The controls stay usable: the volume slider and every button show.
    await expect(
      video(page).getByRole("slider", { name: "Volume" }),
    ).toBeVisible();
    await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .focus();
    const ring = await video(page)
      .getByRole("button", { name: "Play", exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).not.toBe("none");
  });
});
