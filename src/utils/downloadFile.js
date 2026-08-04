// @ts-check

/**
 * Downloads `data` as a file. Wraps `data` in a `Blob` when it is a string,
 * then triggers the download through a temporary object URL and anchor click.
 *
 * @param {string | Blob} data - The file content
 * @param {string} filename - The downloaded file name
 * @param {string} [type] - The MIME type used to build the `Blob` when `data` is a string
 */
export function downloadFile(data, filename, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
