/**
 * A deliberately small YAML subset reader.
 *
 * DESIGN.md frontmatter in the wild uses only two shapes: top-level scalars
 * (`name: X`) and one level of nested mappings under a key
 * (`colors:` then indented `primary: "#5e6ad2"`). A handful of files nest one
 * more level inside `typography` (`display-xl:` then `fontFamily: ...`).
 *
 * Pulling in a full YAML parser would mean a runtime dependency this plugin
 * does not otherwise need, and the plugin must keep loading even when a host
 * profile is missing packages. So this reader handles exactly what the corpus
 * uses, quotes its values, and refuses to guess at anything else: unsupported
 * constructs yield `undefined` rather than a wrong answer.
 */

const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(.*)$/;

function unquote(raw) {
  const value = raw.trim();
  if (value === '' || value === '~' || value === 'null') return undefined;
  if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
    const body = value.slice(1, -1);
    return body.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length > 1) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  // Strip a trailing comment only when it is clearly one (space before `#`).
  const hash = value.search(/\s#/);
  return (hash === -1 ? value : value.slice(0, hash)).trim();
}

function indentOf(line) {
  let count = 0;
  while (count < line.length && line[count] === ' ') count += 1;
  return count;
}

/**
 * Parse a frontmatter block into a plain object.
 *
 * Nested mappings are returned as nested objects; deeper nesting than three
 * levels, sequences and multi-line strings are skipped rather than
 * misinterpreted, because no document in the bundled corpus needs them.
 *
 * @param {string[]} lines the lines strictly between the two `---` markers.
 * @returns {Record<string, unknown>} parsed mapping, possibly empty.
 */
export function parseYamlSubset(lines) {
  const root = {};
  /** Stack of [indent, container]. The root sits at indent -1. */
  const stack = [[-1, root]];

  for (const rawLine of lines) {
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue;
    if (rawLine.trim() === '---') break;
    // A sequence item is not a mapping key; the bundled corpus has none in
    // frontmatter, so dropping it beats inventing a shape.
    if (/^\s*-/.test(rawLine)) continue;

    const indent = indentOf(rawLine);
    const match = KEY_LINE.exec(rawLine.trim());
    if (!match) continue;
    const [, key, rest] = match;

    while (stack.length > 1 && indent <= stack[stack.length - 1][0]) stack.pop();
    const parent = stack[stack.length - 1][1];
    if (parent === null || typeof parent !== 'object') continue;

    const value = unquote(rest);
    if (value === undefined || value === '') {
      // An empty value is either a nested mapping (indented children follow) or
      // an explicitly empty scalar; the next line decides.
      const child = {};
      parent[key] = child;
      stack.push([indent, child]);
    }
    else {
      parent[key] = value;
    }
  }

  // A container that never received children was an empty scalar all along.
  for (const key of Object.keys(root)) {
    const value = root[key];
    if (value !== null && typeof value === 'object' && Object.keys(value).length === 0) {
      delete root[key];
    }
  }
  return root;
}

/**
 * Split `---`-delimited frontmatter off a Markdown document.
 *
 * @param {string} text full document text.
 * @returns {{ frontmatter: Record<string, unknown>, body: string, hasFrontmatter: boolean }}
 */
export function splitFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized, hasFrontmatter: false };
  }
  const end = normalized.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: {}, body: normalized, hasFrontmatter: false };
  }
  const block = normalized.slice(4, end).split('\n');
  const afterMarker = normalized.indexOf('\n', end + 1);
  const body = afterMarker === -1 ? '' : normalized.slice(afterMarker + 1);
  return { frontmatter: parseYamlSubset(block), body, hasFrontmatter: true };
}
