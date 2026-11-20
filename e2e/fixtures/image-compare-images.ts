// Test images for ImageCompare, drawn as SVG data URIs when the page loads, so
// the repo carries no image files. Each carries a grid and corner marks, so a
// frame that squeezes or shifts one side is easy to see.

function uri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A landscape: `vivid` is the edited photo, otherwise a flat, noisy one. */
export function photo(vivid: boolean, width = 800, height = 450) {
  const filter = vivid
    ? ""
    : `<filter id="f"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feBlend in="SourceGraphic" in2="g" mode="multiply"/><feColorMatrix type="saturate" values="0.25"/></filter>`;
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<defs>${filter}
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${vivid ? "#1d4ed8" : "#6b7a99"}"/><stop offset="1" stop-color="${vivid ? "#fb923c" : "#b5aa9c"}"/></linearGradient></defs>
<g ${vivid ? "" : 'filter="url(#f)"'}>
<rect width="${width}" height="${height}" fill="url(#s)"/>
<circle cx="${width * 0.7}" cy="${height * 0.55}" r="${height * 0.12}" fill="${vivid ? "#fde047" : "#d8d0b8"}"/>
<path d="M0 ${height * 0.75} L${width * 0.2} ${height * 0.4} L${width * 0.38} ${height * 0.62} L${width * 0.6} ${height * 0.3} L${width * 0.85} ${height * 0.7} L${width} ${height * 0.55} V${height} H0Z" fill="${vivid ? "#14532d" : "#5b6a5f"}"/>
<rect y="${height * 0.82}" width="${width}" height="${height * 0.18}" fill="${vivid ? "#0e7490" : "#6f8590"}"/>
</g></svg>`,
  );
}

/** A UI screenshot: the redesign has a bolder header and a primary button. */
export function screen(redesign: boolean, width = 800, height = 450) {
  const accent = redesign ? "#0f62fe" : "#8d8d8d";
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#f4f4f4"/>
<rect width="${width}" height="${redesign ? 64 : 40}" fill="${redesign ? "#161616" : "#e0e0e0"}"/>
<rect x="24" y="${redesign ? 24 : 14}" width="140" height="${redesign ? 16 : 12}" fill="${redesign ? "#ffffff" : "#6f6f6f"}"/>
<rect x="24" y="96" width="${width * 0.55}" height="${redesign ? 28 : 18}" fill="#161616"/>
<rect x="24" y="140" width="${width * 0.7}" height="10" fill="#6f6f6f"/>
<rect x="24" y="160" width="${width * 0.62}" height="10" fill="#6f6f6f"/>
<rect x="24" y="212" width="${redesign ? 180 : 120}" height="${redesign ? 48 : 32}" fill="${accent}"/>
<rect x="24" y="300" width="${(width - 72) / 2}" height="110" fill="#ffffff" stroke="#c6c6c6"/>
<rect x="${48 + (width - 72) / 2}" y="300" width="${(width - 72) / 2}" height="110" fill="#ffffff" stroke="#c6c6c6"/>
</svg>`,
  );
}

/** A grid with a mark per corner and the image's own size in the middle. */
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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${color}"/>${lines.join("")}
<rect width="40" height="40" fill="#000000"/><rect x="${width - 40}" y="${height - 40}" width="40" height="40" fill="#000000"/>
<text x="${width / 2}" y="${height / 2}" fill="#ffffff" font-size="48" font-family="sans-serif" text-anchor="middle">${width}x${height}</text>
</svg>`,
  );
}

/** A screenshot with a changed region: the diff review's two captures. */
export function dashboard(changed: boolean, width = 800, height = 450) {
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#ffffff"/>
<rect width="${width}" height="48" fill="#161616"/>
<rect x="24" y="80" width="${(width - 96) / 3}" height="120" fill="#e0e0e0"/>
<rect x="${48 + (width - 96) / 3}" y="80" width="${(width - 96) / 3}" height="120" fill="#e0e0e0"/>
<rect x="${72 + (2 * (width - 96)) / 3}" y="80" width="${(width - 96) / 3}" height="120" fill="${changed ? "#da1e28" : "#e0e0e0"}"/>
<rect x="24" y="224" width="${width - 48}" height="${height - 260}" fill="#f4f4f4" stroke="#c6c6c6"/>
${changed ? `<rect x="24" y="${height - 120}" width="${width - 48}" height="12" fill="#0f62fe" transform="translate(0 -14)"/>` : ""}
</svg>`,
  );
}
