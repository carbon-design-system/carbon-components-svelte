import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import AsyncButton from "./AsyncButton.test.svelte";

const deferred = () => {
  let resolve = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("AsyncButton", () => {
  it("shows the active status in place of the button, then the finished status", async () => {
    const work = deferred();
    const { component } = render(AsyncButton, { onClick: () => work.promise });

    await user.click(screen.getByRole("button", { name: "Reserve" }));
    expect(screen.queryByRole("button", { name: "Reserve" })).toBeNull();
    expect(screen.getByText("Reserving")).toBeInTheDocument();
    expect(component.status).toBe("active");

    work.resolve();
    await work.promise;
    await tick();

    expect(screen.getByText("Room reserved")).toBeInTheDocument();
    expect(component.status).toBe("finished");
    expect(component.finishes).toBe(1);
  });

  it("shows the button again with the error when the work rejects", async () => {
    const { component } = render(AsyncButton, {
      onClick: () => Promise.reject(new Error("Sold out")),
    });

    await user.click(screen.getByRole("button", { name: "Reserve" }));

    expect(await screen.findByText("Sold out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reserve" })).toBeEnabled();
    expect(component.status).toBe("error");
    expect(component.finishes).toBe(0);
  });

  it("offers the action again when status is set back to idle", async () => {
    const { rerender } = render(AsyncButton, { status: "finished" });
    expect(screen.queryByRole("button", { name: "Reserve" })).toBeNull();

    await rerender({ status: "idle" });

    expect(screen.getByRole("button", { name: "Reserve" })).toBeInTheDocument();
  });

  it("does not run while disabled", async () => {
    const onClick = vi.fn();
    render(AsyncButton, { onClick, disabled: true });

    await user.click(screen.getByRole("button", { name: "Reserve" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
