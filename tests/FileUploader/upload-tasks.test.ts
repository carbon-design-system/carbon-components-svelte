import { createUploadTasks } from "../../src/FileUploader/upload-tasks.js";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createUploadTasks", () => {
  test("sync calls upload once per new file with an AbortSignal", () => {
    const file = new File(["a"], "a.txt");
    const calls: File[] = [];
    let signal: AbortSignal | undefined;
    const { promise } = deferred();
    const queue = createUploadTasks((f, options) => {
      calls.push(f);
      signal = options.signal;
      return promise;
    });

    queue.sync([file]);
    expect(calls).toEqual([file]);
    expect(signal).toBeInstanceOf(AbortSignal);

    queue.sync([file]);
    expect(calls).toEqual([file]);
  });

  test("onProgress updates fileProgress after a microtask", async () => {
    const file = new File(["a"], "a.txt");
    const { promise } = deferred();
    let onProgress!: (ratio: number) => void;
    const queue = createUploadTasks((_file, options) => {
      onProgress = options.onProgress;
      return promise;
    });

    queue.sync([file]);
    onProgress(0.25);
    await Promise.resolve();

    expect(queue.fileProgress(file)).toBe(0.25);
  });

  test("resolving upload marks the file complete", async () => {
    const file = new File(["a"], "a.txt");
    const { promise, resolve } = deferred();
    const queue = createUploadTasks(() => promise);

    queue.sync([file]);
    resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(queue.fileStatus(file)).toBe("complete");
    expect(queue.fileInvalid(file)).toBe(false);
  });

  test("rejecting upload marks the file invalid with the error message", async () => {
    const file = new File(["a"], "a.txt");
    const { promise, reject } = deferred();
    const queue = createUploadTasks(() => promise);

    queue.sync([file]);
    reject(new Error("nope"));
    await Promise.resolve();
    await Promise.resolve();

    expect(queue.fileStatus(file)).toBe("edit");
    expect(queue.fileInvalid(file)).toBe(true);
    expect(queue.fileErrorSubject(file)).toBe("nope");
  });

  test("sync([]) aborts the signal and a late resolve does not revive the task", async () => {
    const file = new File(["a"], "a.txt");
    const { promise, resolve } = deferred();
    let signal!: AbortSignal;
    const queue = createUploadTasks((_file, options) => {
      signal = options.signal;
      return promise;
    });

    queue.sync([file]);
    queue.sync([]);
    expect(signal.aborted).toBe(true);

    resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(queue.fileStatus(file)).toBe("uploading");
  });

  test("retry calls upload a second time", () => {
    const file = new File(["a"], "a.txt");
    let callCount = 0;
    const { promise } = deferred();
    const queue = createUploadTasks(() => {
      callCount++;
      return promise;
    });

    queue.sync([file]);
    expect(callCount).toBe(1);

    queue.retry(file);
    expect(callCount).toBe(2);
  });
});
