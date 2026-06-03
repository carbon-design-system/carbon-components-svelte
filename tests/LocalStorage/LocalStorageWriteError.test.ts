import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupLocalStorageMock } from "../utils/storage-mocks";
import LocalStorageWriteError from "./LocalStorageWriteError.test.svelte";

describe("LocalStorage - write errors", () => {
  setupLocalStorageMock();

  it("dispatches error event when a write fails", async () => {
    const quotaError = new Error("QuotaExceededError");
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw quotaError;
    });

    const onError = vi.fn();
    render(LocalStorageWriteError, {
      props: { key: "test-key", value: "test-value", onError },
    });
    await tick();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].detail).toEqual({ error: quotaError });
  });
});
