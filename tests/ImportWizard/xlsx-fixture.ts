import { crc32, deflateRawSync } from "node:zlib";

/** Build a zip from named text entries, deflating each one. */
export function zip(
  entries: Record<string, string>,
  options: { store?: boolean; encrypt?: boolean } = {},
): Uint8Array {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const raw = Buffer.from(text);
    const method = options.store ? 0 : 8;
    const data = options.store ? raw : deflateRawSync(raw);
    const nameBytes = Buffer.from(name);
    const crc = crc32(raw);
    const flags = options.encrypt ? 1 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    chunks.push(local, nameBytes, data);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(flags, 8);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...chunks, directory, end]));
}

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

export type Cell =
  | string
  | number
  | { s: string }
  | { n: number; style: number }
  | { b: boolean }
  | { inline: string }
  | null;

export function sheetXml(rows: Cell[][], shared: string[]) {
  const letters = (i: number) => String.fromCharCode(65 + i);
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          const ref = `${letters(c)}${r + 1}`;
          if (cell === null) return "";
          if (typeof cell === "number")
            return `<c r="${ref}"><v>${cell}</v></c>`;
          if (typeof cell === "string") {
            let at = shared.indexOf(cell);
            if (at === -1) at = shared.push(cell) - 1;
            return `<c r="${ref}" t="s"><v>${at}</v></c>`;
          }
          if ("n" in cell)
            return `<c r="${ref}" s="${cell.style}"><v>${cell.n}</v></c>`;
          if ("b" in cell)
            return `<c r="${ref}" t="b"><v>${cell.b ? 1 : 0}</v></c>`;
          if ("inline" in cell) {
            return `<c r="${ref}" t="inlineStr"><is><t>${cell.inline}</t></is></c>`;
          }
          return `<c r="${ref}" t="str"><v>${cell.s}</v></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0"?><worksheet ${NS}><sheetData>${body}</sheetData></worksheet>`;
}

export function workbook(
  sheets: Array<{ name: string; rows: Cell[][]; state?: string }>,
  options: { date1904?: boolean; sharedExtra?: string } = {},
) {
  const shared: string[] = [];
  const files: Record<string, string> = {
    "xl/workbook.xml": `<?xml version="1.0"?><workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr${
      options.date1904 ? ' date1904="1"' : ""
    }/><sheets>${sheets
      .map(
        (s, i) =>
          `<sheet name="${s.name}" sheetId="${i + 1}"${s.state ? ` state="${s.state}"` : ""} r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships>${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("")}</Relationships>`,
    "xl/styles.xml": `<styleSheet ${NS}><numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/><numFmt numFmtId="165" formatCode="0.00&quot; d&quot;"/></numFmts><cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs></styleSheet>`,
  };
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s.rows, shared);
  });
  files["xl/sharedStrings.xml"] = `<sst ${NS}>${shared
    .map((t) => `<si><t>${t}</t></si>`)
    .join("")}${options.sharedExtra || ""}</sst>`;
  return files;
}
