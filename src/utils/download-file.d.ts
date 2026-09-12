/**
 * Downloads `data` as a file. Wraps `data` in a `Blob` when it is a string,
 * then triggers the download through a temporary object URL and anchor click.
 */
export function downloadFile(
  data: string | Blob,
  filename: string,
  type?: string,
): void;
