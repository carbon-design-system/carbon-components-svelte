// @ts-check
// Arrange properties into the inspector's groups and rows, and filter them.

/**
 * @typedef {object} SectionProperty
 * @property {string} id
 * @property {string} label
 * @property {string} [group]
 * @property {string} [row] - Properties with the same `row` in a group share a line.
 * @property {string} [rowLabel] - The label of the shared line. Defaults to the first property's `label`.
 * @property {ReadonlyArray<string>} [keywords] - Extra words search matches.
 */

/**
 * @typedef {object} Row
 * @property {string} id
 * @property {string} label
 * @property {ReadonlyArray<any>} properties
 */

/**
 * @typedef {object} Section
 * @property {string} id
 * @property {string} label
 * @property {Row[]} rows
 * @property {number} count - The number of properties shown.
 */

const RE_WHITESPACE = /\s+/;

/**
 * @param {string} query
 * @returns {string[]}
 */
export function queryTokens(query) {
  return query.toLowerCase().split(RE_WHITESPACE).filter(Boolean);
}

/**
 * Whether every word in the query appears in the property's label, id,
 * row label, group label, or keywords.
 *
 * @param {SectionProperty} property
 * @param {string} groupLabel
 * @param {ReadonlyArray<string>} tokens
 * @param {string} [rowLabel] - The label of the row the property shares, when its own `rowLabel` is unset.
 * @returns {boolean}
 */
export function matchesQuery(property, groupLabel, tokens, rowLabel) {
  if (!tokens.length) return true;
  const haystack = [
    property.label,
    property.id,
    property.rowLabel ?? rowLabel,
    groupLabel,
    ...(property.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/**
 * @param {ReadonlyArray<string | { id: string; label?: string }> | undefined} groups
 * @returns {Map<string, string>}
 */
function groupLabels(groups) {
  /** @type {Map<string, string>} */
  const labels = new Map();
  for (const group of groups ?? []) {
    if (typeof group === "string") labels.set(group, group);
    else labels.set(group.id, group.label ?? group.id);
  }
  return labels;
}

/**
 * Group the properties that apply to the selection and match the query.
 * Groups appear in the order `groups` lists them, then in the order their
 * first property appears. Consecutive properties that share a `row` join one
 * row.
 *
 * @param {ReadonlyArray<SectionProperty>} properties
 * @param {{ get(id: string): { applicable: boolean } | undefined }} states
 * @param {object} [options]
 * @param {string} [options.query]
 * @param {ReadonlyArray<string | { id: string; label?: string }>} [options.groups]
 * @returns {Section[]}
 */
export function buildSections(properties, states, options = {}) {
  const tokens = queryTokens(options.query ?? "");
  const labels = groupLabels(options.groups);
  /** @type {Map<string, Section>} */
  const sections = new Map();
  for (const id of labels.keys()) {
    sections.set(id, { id, label: labels.get(id) ?? id, rows: [], count: 0 });
  }

  /** @type {Map<string, string>} */
  const rowLabels = new Map();

  for (const property of properties) {
    if (!states.get(property.id)?.applicable) continue;
    const groupId = property.group ?? "";
    let section = sections.get(groupId);
    if (!section) {
      section = { id: groupId, label: groupId, rows: [], count: 0 };
      sections.set(groupId, section);
    }
    const rowKey = `${groupId}\u0000${property.row}`;
    if (property.row && property.rowLabel) {
      rowLabels.set(rowKey, property.rowLabel);
    }
    if (!matchesQuery(property, section.label, tokens, rowLabels.get(rowKey))) {
      continue;
    }

    const last = section.rows[section.rows.length - 1];
    if (property.row && last && last.id === property.row) {
      /** @type {any[]} */ (last.properties).push(property);
    } else {
      section.rows.push({
        id: property.row ?? property.id,
        label: property.rowLabel ?? property.label,
        properties: [property],
      });
    }
    section.count++;
  }

  return [...sections.values()].filter((section) => section.count > 0);
}
