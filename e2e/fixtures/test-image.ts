/**
 * A test picture as an SVG data URI: a gradient with a labelled grid, so a
 * zoomed view shows detail and a pan shows which part of the image is in view.
 */
export function testImage(
  width: number,
  height: number,
  label: string,
  hue = 210,
): string {
  const step = Math.max(50, Math.round(Math.min(width, height) / 12));
  const lines: string[] = [];
  for (let x = 0; x <= width; x += step) {
    lines.push(`<path d="M${x} 0V${height}" />`);
  }
  for (let y = 0; y <= height; y += step) {
    lines.push(`<path d="M0 ${y}H${width}" />`);
  }
  const font = Math.round(Math.min(width, height) / 8);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 80) % 360} 70% 35%)"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><g stroke="#fff" stroke-opacity=".35" stroke-width="2">${lines.join("")}</g><text x="${width / 2}" y="${height / 2}" font-family="sans-serif" font-size="${font}" fill="#fff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
