import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageMock } from "../utils/storage-mocks";
import SessionStorageWriteError from "./SessionStorageWriteError.test.svelte";

describe("SessionStorage - write errors", () => {
  setupSessionStorageMock();

  it("dispatches error event when a write fails", async () => {
    const quotaError = new Error("QuotaExceededError");
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw quotaError;
    });

    const onError = vi.fn();
    render(SessionStorageWriteError, {
      props: { key: "test-key", value: "test-value", onError },
    });
    await tick();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].detail).toEqual({ error: quotaError });
  });
});
