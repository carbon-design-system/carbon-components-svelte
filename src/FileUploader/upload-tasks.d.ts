import type { Writable } from "svelte/store";

export interface UploadTask {
  status: "uploading" | "complete" | "edit";
  progress: number | undefined;
  invalid: boolean;
  errorSubject: string;
  errorBody: string;
  controller: AbortController;
}

export interface UploadTasks {
  tasks: Writable<Map<File, UploadTask>>;
  sync(files: ReadonlyArray<File>): void;
  retry(file: File): void;
  fileStatus(file: File): "uploading" | "complete" | "edit";
  fileProgress(file: File): number | undefined;
  fileInvalid(file: File): boolean;
  fileErrorSubject(file: File): string;
  fileErrorBody(file: File): string;
}

/**
 * Create an opt-in task queue that runs a caller-supplied `upload` function
 * per `File`, tracking status/progress/error state without performing HTTP
 * itself. The returned callbacks match the shape `FileUploader`'s
 * `fileStatus`/`fileInvalid`/`fileErrorSubject`/`fileErrorBody` props expect.
 */
export function createUploadTasks(
  upload: (
    file: File,
    options: { signal: AbortSignal; onProgress: (ratio: number) => void },
  ) => Promise<void>,
): UploadTasks;
