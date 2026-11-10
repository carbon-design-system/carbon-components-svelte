// Svelte 5 only: `<svelte:boundary>` does not compile on Svelte 3 or 4. The
// `.svelte5.test.ts` suffix keeps this file out of those harnesses.
import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ErrorBoundary from "./ErrorBoundary.test.svelte";

describe("ErrorBoundary", () => {
  it("renders its content when nothing throws", () => {
    render(ErrorBoundary);

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the fallback and dispatches error when a child throws", () => {
    const onerror = vi.fn();
    const error = new Error("boom");
    render(ErrorBoundary, { control: { fail: error }, onerror });

    expect(screen.queryByTestId("child")).toBeNull();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(onerror).toHaveBeenCalledTimes(1);
    expect(onerror.mock.calls[0][0].detail.error).toBe(error);
    expect(onerror.mock.calls[0][0].detail.reset).toBeTypeOf("function");
  });

  it("keeps the error message out of the fallback by default", () => {
    render(ErrorBoundary, {
      control: { fail: new Error("db password is hunter2") },
    });

    expect(screen.getByRole("alert")).not.toHaveTextContent("hunter2");
  });

  it("shows the error message when showError is set", () => {
    render(ErrorBoundary, {
      control: { fail: new Error("db password is hunter2") },
      showError: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("hunter2");
  });

  it("renders the content again after retry once it stops throwing", async () => {
    const control = { fail: new Error("boom") as unknown };
    render(ErrorBoundary, { control });
    expect(screen.queryByTestId("child")).toBeNull();

    control.fail = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the fallback again when the retry throws too", async () => {
    const onerror = vi.fn();
    render(ErrorBoundary, {
      control: { fail: new Error("boom") },
      onerror,
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onerror).toHaveBeenCalledTimes(2);
  });

  it("takes every string as a prop", () => {
    render(ErrorBoundary, {
      control: { fail: new Error("boom") },
      titleText: "Chart failed",
      subtitleText: "Reload the chart.",
      retryText: "Reload",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Chart failed");
    expect(alert).toHaveTextContent("Reload the chart.");
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  });

  it("hides the retry button when retryText is empty", () => {
    render(ErrorBoundary, {
      control: { fail: new Error("boom") },
      retryText: "",
    });

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards rest props to the default fallback", () => {
    render(ErrorBoundary, {
      control: { fail: new Error("boom") },
      "aria-label": "Chart error",
      "data-testid": "fallback",
    });

    expect(screen.getByTestId("fallback")).toHaveAttribute(
      "aria-label",
      "Chart error",
    );
  });

  describe("failed slot", () => {
    it("replaces the default fallback", () => {
      render(ErrorBoundary, {
        custom: true,
        control: { fail: new Error("boom") },
      });

      expect(screen.getByTestId("custom")).toHaveTextContent("Custom: boom");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("passes reset, which renders the content again", async () => {
      const control = { fail: new Error("boom") as unknown };
      render(ErrorBoundary, { custom: true, control });

      control.fail = false;
      await user.click(screen.getByRole("button", { name: "Reload" }));

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.queryByTestId("custom")).toBeNull();
    });
  });
});
