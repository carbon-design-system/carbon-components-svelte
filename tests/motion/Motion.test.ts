import { render, screen, waitFor } from "@testing-library/svelte";
import MotionTest from "./Motion.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const target = () => screen.queryByTestId("target");

type Props = Partial<{
  outer: unknown;
  inner: unknown;
  transition: unknown;
  nested: boolean;
}>;

/** Hide the spinner, and report whether it stayed for an exit. */
async function exitAnimates(props: Props) {
  const { rerender } = render(MotionTest, props as never);
  await sleep(DURATION * 3);
  await rerender({ show: false });
  const animates = target() !== null;
  await waitFor(() => expect(target()).not.toBeInTheDocument());
  return animates;
}

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("Motion", () => {
  it("leaves motion off when unset", async () => {
    expect(await exitAnimates({})).toBe(false);
  });

  it("turns on the role's preset", async () => {
    expect(
      await exitAnimates({ outer: { loading: { duration: DURATION } } }),
    ).toBe(true);
  });

  it("lets a role prop win over transition", async () => {
    expect(
      await exitAnimates({
        outer: { transition: { duration: DURATION }, loading: false },
      }),
    ).toBe(false);
  });

  it("turns on every role with shared params", async () => {
    expect(
      await exitAnimates({ outer: { transition: { duration: DURATION } } }),
    ).toBe(true);
  });

  it("leaves other roles alone", async () => {
    expect(await exitAnimates({ outer: { menu: true } })).toBe(false);
  });

  it("lets the component's own prop win", async () => {
    expect(
      await exitAnimates({
        outer: { transition: { duration: DURATION } },
        transition: false,
      }),
    ).toBe(false);
    expect(
      await exitAnimates({
        outer: { transition: false },
        transition: { duration: DURATION },
      }),
    ).toBe(true);
  });

  it("falls back to the enclosing Motion for an unset role", async () => {
    expect(
      await exitAnimates({
        nested: true,
        outer: { loading: { duration: DURATION } },
        inner: { menu: false },
      }),
    ).toBe(true);
  });

  it("lets the inner Motion override a role", async () => {
    expect(
      await exitAnimates({
        nested: true,
        outer: { transition: { duration: DURATION } },
        inner: { loading: false },
      }),
    ).toBe(false);
  });

  it("follows a change to the setting", async () => {
    const { rerender } = render(MotionTest, {
      outer: { transition: false },
    } as never);
    await rerender({ outer: { transition: { duration: DURATION } } });
    await sleep(DURATION * 3);
    await rerender({ show: false });
    expect(target()).toBeInTheDocument();
    await waitFor(() => expect(target()).not.toBeInTheDocument());
  });

  it("renders no element of its own", () => {
    const { container } = render(MotionTest, {
      outer: { transition: true },
    } as never);
    expect(container.firstElementChild).toBe(target());
  });
});
