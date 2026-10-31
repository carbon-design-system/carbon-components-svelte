import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../../utils/user";
import LiveSparkline from "./LiveSparkline.test.svelte";

const frames: FrameRequestCallback[] = [];
let hidden = false;

async function runFrame() {
  const pending = frames.splice(0);
  for (const frame of pending) frame(performance.now());
  await tick();
}

const points = () =>
  (
    screen
      .getByTestId("live")
      .querySelector("path.bx--sparkline__line")
      ?.getAttribute("d") ?? ""
  ).split(/[ML]/).length - 1;

beforeEach(() => {
  frames.length = 0;
  hidden = false;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    frames.push(cb);
    return frames.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LiveSparkline", () => {
  it("starts from the seed and appends pushed samples on the next frame", async () => {
    render(LiveSparkline);
    expect(points()).toBe(3);

    await user.click(screen.getByText("push"));
    expect(points()).toBe(3);
    expect(frames).toHaveLength(1);

    await runFrame();
    expect(points()).toBe(4);
    expect(screen.getByTestId("shown")).toHaveTextContent("1,2,3,10");
  });

  it("draws a burst once and keeps only the last capacity samples", async () => {
    render(LiveSparkline);

    await user.click(screen.getByText("burst"));
    await user.click(screen.getByText("push"));
    expect(frames).toHaveLength(1);

    await runFrame();
    expect(screen.getByTestId("shown")).toHaveTextContent("3,10,11,12,13");
    expect(points()).toBe(5);
  });

  it("renders an initial value at once and appends when it changes", async () => {
    const { rerender } = render(LiveSparkline, { value: 7 });
    expect(points()).toBe(4);
    expect(frames).toHaveLength(0);

    await rerender({ value: 8 });
    await runFrame();
    expect(screen.getByTestId("shown")).toHaveTextContent("1,2,3,7,8");
  });

  it("holds samples while hidden and draws them when the tab returns", async () => {
    render(LiveSparkline);
    hidden = true;

    await user.click(screen.getByText("push"));
    expect(frames).toHaveLength(0);

    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frames).toHaveLength(1);
    await runFrame();
    expect(points()).toBe(4);
  });

  it("holds samples while paused and draws them on resume", async () => {
    const { rerender } = render(LiveSparkline, { paused: true });

    await user.click(screen.getByText("burst"));
    expect(frames).toHaveLength(0);

    await rerender({ paused: false });
    expect(frames).toHaveLength(1);
    await runFrame();
    expect(screen.getByTestId("shown")).toHaveTextContent("2,3,10,11,12");
  });
});
