import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
import type { ComponentProps } from "svelte";
import type * as TransitionsModule from "../../src/motion/transitions.js";
import { fly } from "../../src/motion/transitions.js";
import { user } from "../utils/user";
import NotificationQueueTransition from "./NotificationQueueTransition.test.svelte";

// Wrap `fly` to see its params, and which variant (shrinking or not) Svelte
// asks for its keyframes.
const cssLog = vi.hoisted(() => [] as Array<boolean | undefined>);

vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const original = await importOriginal<typeof TransitionsModule>();
  return {
    ...original,
    fly: vi.fn((node, params, options) => {
      const config = original.fly(node, params, options);
      const { css } = config;
      if (!css) return config;
      return {
        ...config,
        css: (t: number, u: number) => {
          cssLog.push(params?.collapse);
          return css(t, u);
        },
      };
    }),
  };
});

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toasts = () => document.querySelectorAll(".bx--toast-notification");
const region = () => screen.queryByRole("region");
const placeholders = () =>
  document.querySelectorAll<HTMLElement>(
    ".bx--notification-queue__placeholder",
  );

function getQueue(
  queue: NotificationQueueComponent | undefined,
): NotificationQueueComponent {
  assert(queue);
  return queue;
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Render the queue, add titled toasts, and let Svelte 5 entrances finish. */
async function renderQueue(
  props: Partial<ComponentProps<NotificationQueueTransition>>,
  titles: string[] = ["First"],
) {
  const view = render(NotificationQueueTransition, props);
  const queue = getQueue(view.component.queue);
  const ids = titles.map((title) => queue.add({ title, kind: "info" }));
  await sleep(DURATION * 4);
  expect(toasts()).toHaveLength(titles.length);
  return { ...view, queue, ids };
}

beforeEach(() => {
  vi.mocked(fly).mockClear();
  cssLog.length = 0;
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NotificationQueue transition prop", () => {
  it("removes a toast at once when unset", async () => {
    const { queue, ids } = await renderQueue({});

    queue.remove(ids[0]);
    await sleep(0);

    expect(toasts()).toHaveLength(0);
    expect(fly).not.toHaveBeenCalled();
  });

  it("keeps a removed toast until its exit ends", async () => {
    const { queue, ids } = await renderQueue({
      transition: { duration: DURATION },
    });
    const toast = toasts()[0];
    const onOutroEnd = vi.fn();
    toast.addEventListener("outroend", onOutroEnd);

    queue.remove(ids[0]);
    await sleep(0);
    expect(toast).toBeInTheDocument();

    await waitFor(() => expect(toast).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["top-right", { x: 32 }],
    ["bottom-right", { x: 32 }],
    ["top-left", { x: -32 }],
    ["bottom-left", { x: -32 }],
    ["top-center", { x: 0, y: -16 }],
    ["bottom-center", { x: 0, y: 16 }],
  ] as const)(
    "flies %s toasts in from the queue's edge",
    async (position, from) => {
      await renderQueue({ position, transition: true });

      expect(fly).toHaveBeenCalledWith(
        toasts()[0],
        { ...from, collapse: true },
        expect.anything(),
      );
    },
  );

  it("merges fly params over the edge", async () => {
    await renderQueue({ transition: { duration: "fast01", x: 8 } });

    expect(vi.mocked(fly).mock.calls[0]?.[1]).toEqual({
      duration: "fast01",
      x: 8,
      collapse: true,
    });
  });

  it("lets a toast override the queue's transition", async () => {
    const { component } = render(NotificationQueueTransition, {
      transition: true,
    });
    const queue = getQueue(component.queue);

    queue.add({ title: "Plain", transition: false });
    await sleep(DURATION * 2);
    expect(fly).not.toHaveBeenCalled();

    queue.add({ title: "Custom", transition: { x: 8 } });
    await sleep(0);
    const custom = [...toasts()].find((toast) =>
      toast.textContent?.includes("Custom"),
    );
    expect(fly).toHaveBeenCalledWith(
      custom,
      { x: 8, collapse: true },
      expect.anything(),
    );
  });

  it("plays every toast's exit on clear", async () => {
    const { queue } = await renderQueue(
      { transition: { duration: DURATION } },
      ["One", "Two"],
    );
    const exited: Element[] = [];
    for (const toast of toasts()) {
      toast.addEventListener("outroend", () => exited.push(toast));
    }

    queue.clear();
    await sleep(0);
    expect(toasts()).toHaveLength(2);
    expect(region()).toBeInTheDocument();

    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(exited).toHaveLength(2);
    await waitFor(() => expect(region()).not.toBeInTheDocument());
  });

  it("plays the exit of the toast a full queue drops", async () => {
    const { queue } = await renderQueue(
      { transition: { duration: DURATION }, maxNotifications: 2 },
      ["One", "Two"],
    );
    const oldest = [...toasts()].find((toast) =>
      toast.textContent?.includes("One"),
    );

    queue.add({ title: "Three" });
    await sleep(0);
    expect(oldest).toBeInTheDocument();

    await waitFor(() => expect(oldest).not.toBeInTheDocument());
    expect(toasts()).toHaveLength(2);
  });

  it("removes toasts at once under reduced motion", async () => {
    stubReducedMotion(true);
    const { queue, ids } = await renderQueue({
      transition: { duration: 10_000 },
    });

    queue.remove(ids[0]);

    await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 100 });
  });
});

describe("NotificationQueue transition with a held pointer", () => {
  async function renderHeld(titles = ["Older", "Newer"]) {
    const view = await renderQueue(
      { transition: { duration: DURATION }, maxNotifications: 5 },
      titles,
    );
    await fireEvent.pointerEnter(region() as HTMLElement, {
      pointerType: "mouse",
    });
    return view;
  }

  function closeButton(title: string) {
    const toast = [...toasts()].find((node) =>
      node.textContent?.includes(title),
    );
    return toast?.querySelector<HTMLElement>(
      ".bx--toast-notification__close-button",
    ) as HTMLElement;
  }

  it("holds the space after the exit ends, not before", async () => {
    const { ids, queue } = await renderHeld();
    const toast = [...toasts()].find((node) =>
      node.textContent?.includes("Newer"),
    );

    queue.remove(ids[1]);
    await sleep(0);

    // The leaving toast still fills the space, so the placeholder waits.
    expect(toast).toBeInTheDocument();
    expect(placeholders()).toHaveLength(0);

    await waitFor(() => expect(toast).not.toBeInTheDocument());
    expect(placeholders()).toHaveLength(1);
  });

  it("does not shrink the leaving toast while it holds the space", async () => {
    await renderHeld();
    cssLog.length = 0;

    await user.click(closeButton("Newer"));
    await waitFor(() => expect(toasts()).toHaveLength(1));

    expect(cssLog.length).toBeGreaterThan(0);
    expect(cssLog.every((collapse) => collapse === false)).toBe(true);
  });

  it("shrinks the leaving toast when nothing holds the space", async () => {
    const { queue, ids } = await renderQueue(
      { transition: { duration: DURATION } },
      ["Older", "Newer"],
    );
    cssLog.length = 0;

    queue.remove(ids[1]);
    await waitFor(() => expect(toasts()).toHaveLength(1));

    expect(placeholders()).toHaveLength(0);
    expect(cssLog.length).toBeGreaterThan(0);
    expect(cssLog.every((collapse) => collapse === true)).toBe(true);
  });

  it("holds the space at once when the toast has no exit", async () => {
    const { component } = render(NotificationQueueTransition, {});
    const queue = getQueue(component.queue);
    queue.add({ title: "Older" });
    const id = queue.add({ title: "Newer" });
    await sleep(0);
    await fireEvent.pointerEnter(region() as HTMLElement, {
      pointerType: "mouse",
    });

    queue.remove(id);
    await sleep(0);

    expect(placeholders()).toHaveLength(1);
  });

  it("measures a toast while another is still leaving", async () => {
    // A leaving toast stays in the page, but it is no longer an entry.
    const heights: Record<string, number> = {
      One: 50,
      Two: 100,
      Three: 30,
      Four: 20,
    };
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        const title = Object.keys(heights).find((key) =>
          this.textContent?.includes(key),
        );
        return title ? heights[title] : 7;
      },
    );
    const { ids, queue } = await renderHeld(["Four", "Three", "Two", "One"]);

    queue.remove(ids[2]);
    await sleep(0);
    queue.remove(ids[1]);
    await sleep(0);

    await waitFor(() => expect(placeholders()).toHaveLength(2));
    expect([...placeholders()].map((node) => node.style.blockSize)).toEqual([
      "100px",
      "30px",
    ]);
  });
});
