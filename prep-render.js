export function renderLevelSectionsHtml({
  levels,
  viewLevel,
  entries,
  selectedIds,
  hiddenIds,
  archivedIds,
  renderSentenceCard,
}) {
  const targetLevels = viewLevel
    ? levels.filter(function (level) {
        return level.id === viewLevel;
      })
    : levels;

  return targetLevels
    .map(function (level) {
      const visibleEntries = entries.filter(function (entry) {
        const archived = archivedIds.has(entry.id) && !selectedIds.has(entry.id);
        return entry.level === level.id && !hiddenIds.has(entry.id) && !archived;
      });

      const cards = visibleEntries.map(renderSentenceCard).join("");
      return `
        <details class="level-section" id="level-${level.id}" open>
          <summary>
            <div>
              <strong>${level.label}</strong>
              <span>${level.summary}</span>
            </div>
          </summary>
          <div class="level-section-body">
            ${cards || `<p class="empty-level">No available sentences in this level right now.</p>`}
          </div>
        </details>
      `;
    })
    .join("");
}

export function renderSelectedStackHtml({
  entries,
  mode,
  templateHelpers,
  profileOverride,
  removable,
  emptyMessage,
}) {
  if (!entries.length) {
    return `<p class="empty-stack">${emptyMessage}</p>`;
  }

  return entries
    .map(function (entry) {
      return renderStackCard({
        entry,
        mode,
        templateHelpers,
        profileOverride,
        removable,
      });
    })
    .join("");
}

export function renderArchivedSessionsHtml({
  sessions,
  mode,
  getEntriesForSession,
  templateHelpers,
  formatSessionDate,
}) {
  if (!sessions.length) {
    return `<p class="empty-stack archive-empty">No earlier meetups yet.</p>`;
  }

  const content = sessions
    .map(function (session) {
      const entries = getEntriesForSession(session);
      if (!entries.length) {
        return "";
      }

      return `
        <details class="archive-session">
          <summary>
            <div class="archive-session-summary">
              <strong>${session.title}</strong>
              <span>${formatSessionDate(session.date)}</span>
            </div>
            <span class="archive-session-count">${entries.length}</span>
          </summary>
          <div class="archive-session-body">
            ${renderSelectedStackHtml({
              entries,
              mode,
              templateHelpers,
              profileOverride: session.profileSnapshot || undefined,
              removable: false,
              emptyMessage: "",
            })}
          </div>
        </details>
      `;
    })
    .filter(Boolean)
    .join("");

  return content || `<p class="empty-stack archive-empty">No earlier meetups for this page yet.</p>`;
}

function renderStackCard({ entry, mode, templateHelpers, profileOverride, removable }) {
  const englishHtml = templateHelpers.renderTemplateHtml(entry.english, { profileOverride });
  const mandarinHtml = templateHelpers.renderTemplateHtml(entry.mandarin, { profileOverride });
  const pinyinHtml = templateHelpers.renderTemplateHtml(entry.pinyin, { profileOverride });
  const actionHtml = removable
    ? `<button class="mini-button" type="button" data-remove-selected="${entry.id}">Remove</button>`
    : "";

  return `
    <article class="selected-card">
      <div class="selected-card-head">
        <h4>${entry.title}</h4>
        ${actionHtml}
      </div>
      ${
        mode === "english"
          ? `
            <p>${englishHtml}</p>
            <p class="selected-support">${mandarinHtml}</p>
          `
          : `
            <p>${mandarinHtml}</p>
            <p class="selected-support">${pinyinHtml}</p>
            <p class="selected-support">${englishHtml}</p>
          `
      }
    </article>
  `;
}
