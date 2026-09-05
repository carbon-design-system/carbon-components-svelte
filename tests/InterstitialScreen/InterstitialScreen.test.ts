import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import InterstitialScreenTest from "./InterstitialScreen.test.svelte";

describe("InterstitialScreen", () => {
  it("renders modal-hosted by default", () => {
    render(InterstitialScreenTest, { props: { open: true } });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a full-screen takeover when isFullScreen is true", () => {
    render(InterstitialScreenTest, {
      props: { open: true, isFullScreen: true },
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main).toHaveClass("bx--interstitial-screen--full-screen");
  });

  it("single view: shows only the Get Started button and no progress indicator", () => {
    render(InterstitialScreenTest, { props: { open: true, stepCount: 1 } });

    expect(
      screen.getByRole("button", { name: "Get Started" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of/)).not.toBeInTheDocument();
  });

  it("multi-step: shows Skip/Next on the first step, no Back", () => {
    render(InterstitialScreenTest, { props: { open: true, stepCount: 3 } });

    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("Next advances the step and reveals Back; the final step shows Get Started instead of Next", async () => {
    render(InterstitialScreenTest, { props: { open: true, stepCount: 2 } });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await tick();

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get Started" }),
    ).toBeInTheDocument();
  });

  it("Back returns to the previous step", async () => {
    render(InterstitialScreenTest, { props: { open: true, stepCount: 2 } });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await tick();
    await user.click(screen.getByRole("button", { name: "Back" }));
    await tick();

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("hides Skip when skipButtonText is empty", () => {
    render(InterstitialScreenTest, {
      props: { open: true, stepCount: 3, skipButtonText: "" },
    });
    expect(
      screen.queryByRole("button", { name: "Skip" }),
    ).not.toBeInTheDocument();
  });

  it("a consumer preventing the action event blocks default step advancement", async () => {
    const onaction = vi.fn((e) => e.preventDefault());
    render(InterstitialScreenTest, {
      props: { open: true, stepCount: 2, onaction },
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await tick();

    expect(onaction).toHaveBeenCalledTimes(1);
    expect(onaction.mock.calls[0][0].detail).toEqual({ actionType: "next" });
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("dispatches close with actionType 'skip' and closes when not prevented", async () => {
    const onclose = vi.fn();
    render(InterstitialScreenTest, {
      props: { open: true, stepCount: 2, onclose },
    });

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({ actionType: "skip" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preventing the close event keeps the screen open", async () => {
    const onclose = vi.fn((e) => e.preventDefault());
    render(InterstitialScreenTest, {
      props: { open: true, stepCount: 1, onclose },
    });

    await user.click(screen.getByRole("button", { name: "Get Started" }));
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Escape closes in full-screen mode", async () => {
    const onclose = vi.fn();
    render(InterstitialScreenTest, {
      props: { open: true, isFullScreen: true, stepCount: 1, onclose },
    });

    await user.keyboard("{Escape}");
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({ actionType: "close" });
  });

  it("returns focus to the launcher after closing", async () => {
    render(InterstitialScreenTest, { props: { open: false, stepCount: 1 } });

    const launcher = screen.getByRole("button", { name: "Open launcher" });
    await user.click(launcher);
    await tick();

    expect(
      screen.getByRole("button", { name: "Get Started" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Get Started" }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await tick();

    expect(launcher).toHaveFocus();
  });

  it("focuses the primary action button on mount and after each step change", async () => {
    render(InterstitialScreenTest, { props: { open: true, stepCount: 2 } });

    await tick();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await tick();

    expect(screen.getByRole("button", { name: "Get Started" })).toHaveFocus();
  });

  it("shows InlineLoading text on a button while its action is pending", async () => {
    const { rerender } = render(InterstitialScreenTest, {
      props: { open: true, stepCount: 1 },
    });

    await rerender({ open: true, stepCount: 1, loadingAction: "start" });
    await tick();

    const button = screen.getByText("Get Started").closest("button");
    expect(button).toBeDisabled();
  });
});
