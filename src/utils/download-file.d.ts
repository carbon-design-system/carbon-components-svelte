/**
 * Downloads `data` as a file. Wraps `data` in a `Blob` when it is a string,
 * then triggers the download through a temporary object URL and anchor click.
 * Without `data`, there's nothing to download, and it does nothing.
 */
export function downloadFile(
  data: string | Blob | undefined,
  filename: string,
  type?: string,
): void;
