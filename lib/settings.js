/**
 * Settings read/write for the panel.
 *
 * The settings page used to be read-only, and said so in its own copy. That was
 * honest but useless: the only way to change `skillMode` was to hand-edit
 * `cordis.patch.yml`, which is exactly the kind of chore a settings page exists
 * to remove.
 *
 * Writing config from a plugin is not "edit the YAML file". `configEditor.edit`
 * is the documented path: it validates the candidate, serialises the write
 * against other profile changes, refuses values a higher layer overrides, and
 * restarts the plugin so `apply` rebuilds its state. Anything else would race
 * with the user's own edits to that file.
 *
 * The editor edits the *active entry*, which is why the entry is resolved from
 * the row's config at apply time rather than located by walking up directories.
 */

/**
 * @typedef {object} SettingsState
 * @property {'curated'|'all'|'off'} skillMode
 * @property {string[]} roots
 * @property {number} maxEntries
 * @property {boolean} writable whether this profile can persist a change
 * @property {string} [reason] why it is not writable
 */

/** Read the current settings straight from the row config this instance got. */
export function readSettings(config) {
  return {
    skillMode: config?.skillMode ?? 'curated',
    roots: Array.isArray(config?.roots) ? config.roots.map(String) : [],
    maxEntries: Number(config?.maxEntries ?? 5000),
  };
}

/**
 * Apply a partial change to the plugin's own config row.
 *
 * @param {object} ctx Cordis context (needs `fiber.entry` and `configEditor`).
 * @param {object} patch fields to merge; only known keys are honoured.
 * @returns {Promise<{ ok: boolean, settings?: object, error?: string }>}
 */
export async function writeSettings(ctx, patch) {
  const entry = ctx?.fiber?.entry;
  const editor = ctx.get?.('configEditor');
  if (entry === undefined || editor === undefined || typeof editor.edit !== 'function') {
    return {
      ok: false,
      error: 'This profile has no configuration editor, so the change cannot be saved. '
        + 'Edit the row in cordis.patch.yml instead.',
    };
  }

  // Validate before writing. A rejected candidate is a bug in the caller, and
  // letting the editor throw would surface as an opaque failure in the UI.
  const next = {};
  if (patch?.skillMode !== undefined) {
    if (!['curated', 'all', 'off'].includes(patch.skillMode)) {
      return { ok: false, error: `unknown skillMode: ${patch.skillMode}` };
    }
    next.skillMode = patch.skillMode;
  }
  if (patch?.roots !== undefined) {
    if (!Array.isArray(patch.roots)) return { ok: false, error: 'roots must be an array of paths' };
    next.roots = patch.roots.map(String).map((item) => item.trim()).filter((item) => item !== '');
  }
  if (patch?.maxEntries !== undefined) {
    const value = Number(patch.maxEntries);
    if (!Number.isFinite(value) || value < 1) return { ok: false, error: 'maxEntries must be a positive number' };
    next.maxEntries = Math.floor(value);
  }
  if (Object.keys(next).length === 0) {
    return { ok: false, error: 'nothing to change' };
  }

  try {
    await editor.edit(entry, (current) => ({ ...current, ...next }));
    return { ok: true, settings: { ...readSettings({ ...next }), ...next } };
  }
  catch (error) {
    // The editor rejects values a higher layer overrides, and rejects writes
    // while another profile change is in flight. Both are worth showing.
    return { ok: false, error: String(error?.message ?? error) };
  }
}

/**
 * Describe what a skill-mode change would actually do, so the UI can say it in
 * one line instead of leaving the user to guess what "curated" means.
 *
 * @param {number} totalSkills how many skills the library holds
 * @param {number} curatedCount how many the curated list selects
 */
export function describeSkillMode(totalSkills, curatedCount) {
  return {
    curated: `${curatedCount} of ${totalSkills}`,
    all: `${totalSkills} of ${totalSkills}`,
    off: `0 of ${totalSkills}`,
  };
}
