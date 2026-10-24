// @ts-check
import { get, writable } from "svelte/store";

/**
 * @typedef {object} Task
 * @property {"uploading" | "complete" | "edit"} status
 * @property {number | undefined} progress
 * @property {boolean} invalid
 * @property {string} errorSubject
 * @property {string} errorBody
 * @property {AbortController} controller
 */

/**
 * Create an opt-in task queue that runs a caller-supplied `upload` function
 * per `File`, tracking status/progress/error state without performing HTTP
 * itself. The returned callbacks match the shape `FileUploader`'s
 * `fileStatus`/`fileInvalid`/`fileErrorSubject`/`fileErrorBody` props expect.
 *
 * @param {(file: File, options: { signal: AbortSignal; onProgress: (ratio: number) => void }) => Promise<void>} upload
 */
export function createUploadTasks(upload) {
  /** @type {import("svelte/store").Writable<Map<File, Task>>} */
  const tasks = writable(new Map());

  /**
   * @param {File} file
   */
  function start(file) {
    const controller = new AbortController();

    /** @type {Task} */
    const task = {
      status: "uploading",
      progress: undefined,
      invalid: false,
      errorSubject: "",
      errorBody: "",
      controller,
    };

    tasks.update((map) => new Map(map).set(file, task));

    function isCurrent() {
      return get(tasks).get(file)?.controller === controller;
    }

    upload(file, {
      signal: controller.signal,
      onProgress(ratio) {
        if (!isCurrent()) return;
        tasks.update((map) => {
          const next = new Map(map);
          next.set(file, { ...task, progress: ratio });
          return next;
        });
      },
    }).then(
      () => {
        if (!isCurrent()) return;
        tasks.update((map) => {
          const next = new Map(map);
          next.set(file, { ...task, status: "complete", progress: 1 });
          return next;
        });
      },
      (error) => {
        if (!isCurrent()) return;
        tasks.update((map) => {
          const next = new Map(map);
          next.set(file, {
            ...task,
            status: "edit",
            invalid: true,
            errorSubject:
              error instanceof Error ? error.message : "Upload failed",
          });
          return next;
        });
      },
    );
  }

  /**
   * @param {ReadonlyArray<File>} files
   */
  function sync(files) {
    const set = new Set(files);
    const map = get(tasks);

    for (const [file, task] of map) {
      if (!set.has(file)) {
        task.controller.abort();
        tasks.update((current) => {
          const next = new Map(current);
          next.delete(file);
          return next;
        });
      }
    }

    for (const file of files) {
      if (!get(tasks).has(file)) {
        start(file);
      }
    }
  }

  /**
   * @param {File} file
   */
  function retry(file) {
    const task = get(tasks).get(file);
    if (task) {
      task.controller.abort();
      tasks.update((map) => {
        const next = new Map(map);
        next.delete(file);
        return next;
      });
    }
    start(file);
  }

  /**
   * @param {File} file
   */
  function fileStatus(file) {
    return get(tasks).get(file)?.status ?? "uploading";
  }

  /**
   * @param {File} file
   */
  function fileProgress(file) {
    return get(tasks).get(file)?.progress;
  }

  /**
   * @param {File} file
   */
  function fileInvalid(file) {
    return get(tasks).get(file)?.invalid ?? false;
  }

  /**
   * @param {File} file
   */
  function fileErrorSubject(file) {
    return get(tasks).get(file)?.errorSubject ?? "";
  }

  /**
   * @param {File} file
   */
  function fileErrorBody(file) {
    return get(tasks).get(file)?.errorBody ?? "";
  }

  return {
    tasks,
    sync,
    retry,
    fileStatus,
    fileProgress,
    fileInvalid,
    fileErrorSubject,
    fileErrorBody,
  };
}
