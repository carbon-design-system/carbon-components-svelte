// Sample images for the ImageCompare examples, drawn as SVG data URIs so the
// docs ship no image files.

function uri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const noise = `<filter id="f"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feBlend in="SourceGraphic" in2="g" mode="multiply"/><feColorMatrix type="saturate" values="0.25"/></filter>`;

/** A landscape: the edited photo, or the flat, noisy original. */
export function photo(edited: boolean) {
  const [w, h] = [800, 450];
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs>${edited ? "" : noise}<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${edited ? "#1d4ed8" : "#6b7a99"}"/><stop offset="1" stop-color="${edited ? "#fb923c" : "#b5aa9c"}"/></linearGradient></defs><g ${edited ? "" : 'filter="url(#f)"'}><rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="560" cy="250" r="54" fill="${edited ? "#fde047" : "#d8d0b8"}"/><path d="M0 340 L160 180 L300 280 L480 135 L680 315 L800 250 V450 H0Z" fill="${edited ? "#14532d" : "#5b6a5f"}"/><rect y="370" width="${w}" height="80" fill="${edited ? "#0e7490" : "#6f8590"}"/></g></svg>`,
  );
}

/** A dashboard screenshot; `changed` is the build that moved a card and a bar. */
export function dashboard(changed: boolean) {
  const [w, h] = [800, 450];
  const card = (x: number, fill: string) =>
    `<rect x="${x}" y="80" width="232" height="120" fill="${fill}"/>`;
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/><rect width="${w}" height="48" fill="#161616"/><rect x="24" y="18" width="120" height="12" fill="#c6c6c6"/>${card(24, "#e0e0e0")}${card(284, "#e0e0e0")}${card(544, changed ? "#da1e28" : "#e0e0e0")}<rect x="24" y="224" width="752" height="190" fill="#f4f4f4" stroke="#c6c6c6"/>${changed ? '<rect x="24" y="224" width="752" height="12" fill="#0f62fe"/>' : ""}</svg>`,
  );
}

/** A grid with a mark in two corners and its own size in the middle. */
export function grid(width: number, height: number, color: string) {
  const lines: string[] = [];
  for (let x = 0; x <= width; x += width / 8) {
    lines.push(
      `<path d="M${x} 0V${height}" stroke="#ffffff" stroke-opacity=".6"/>`,
    );
  }
  for (let y = 0; y <= height; y += height / 4) {
    lines.push(
      `<path d="M0 ${y}H${width}" stroke="#ffffff" stroke-opacity=".6"/>`,
    );
  }
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${color}"/>${lines.join("")}<rect width="40" height="40" fill="#000000"/><rect x="${width - 40}" y="${height - 40}" width="40" height="40" fill="#000000"/><text x="${width / 2}" y="${height / 2}" fill="#ffffff" font-size="48" font-family="sans-serif" text-anchor="middle">${width}x${height}</text></svg>`,
  );
}
