import {
  AUTO_TRANSLATE_FIELDS,
  FIELD_DEFS,
  INPUT_VARIANTS_BY_MODE,
  LEVELS,
  SENTENCES_BY_MODE,
  STORAGE_KEY,
} from "./prep-data.js";
import {
  copyText,
  createPresentationController,
  createSpeechController,
  createTemplateHelpers,
  createTranslationController,
  escapeAttribute,
  flashButton,
} from "./prep-services.js";

const mode = document.body.getAttribute("data-prep-mode");

if (!mode) {
  throw new Error("Prep mode is required.");
}

const dom = {
  levelSections: document.getElementById("levelSections"),
  selectedStack: document.getElementById("selectedStack"),
  restoreHiddenButton: document.getElementById("restoreHiddenButton"),
  copyPracticeButton: document.getElementById("copyPracticeButton"),
  copyBilingualButton: document.getElementById("copyBilingualButton"),
  presentationModeButton: document.getElementById("presentationModeButton"),
  clearSelectionsButton: document.getElementById("clearSelectionsButton"),
};

const viewLevel = new URLSearchParams(window.location.search).get("level");
const sentences = SENTENCES_BY_MODE[mode] || [];
const inputVariants = INPUT_VARIANTS_BY_MODE[mode] || ["en", "zh", "pinyin"];
let state = loadState();

const templateHelpers = createTemplateHelpers({
  getState: function () {
    return state;
  },
  mode,
});

const translationController = createTranslationController({
  getState: function () {
    return state;
  },
  saveState,
  rerenderPreviewContent,
});

const speechController = createSpeechController();
const presentationController = createPresentationController({
  mode,
  getSelectedEntries,
  renderTemplateHtml: templateHelpers.renderTemplateHtml,
  speakSentenceById,
  presentationModeButton: dom.presentationModeButton,
});

speechController.prime();
render();
bindStaticEvents();

function loadState() {
  const defaults = {
    profile: {},
    pages: {
      english: { selected: [], hidden: [] },
      mandarin: { selected: [], hidden: [] },
    },
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || {},
      pages: {
        english: normalizePageState(parsed.pages && parsed.pages.english),
        mandarin: normalizePageState(parsed.pages && parsed.pages.mandarin),
      },
    };
  } catch (_error) {
    return defaults;
  }
}

function normalizePageState(page) {
  return {
    selected: Array.isArray(page && page.selected) ? page.selected : [],
    hidden: Array.isArray(page && page.hidden) ? page.hidden : [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindStaticEvents() {
  if (dom.restoreHiddenButton) {
    dom.restoreHiddenButton.addEventListener("click", function () {
      state.pages[mode].hidden = [];
      saveState();
      render();
      flashButton(dom.restoreHiddenButton, "Restored");
    });
  }

  if (dom.copyPracticeButton) {
    dom.copyPracticeButton.addEventListener("click", function () {
      copyText(buildPracticeDraft());
      flashButton(dom.copyPracticeButton, "Copied");
    });
  }

  if (dom.copyBilingualButton) {
    dom.copyBilingualButton.addEventListener("click", function () {
      copyText(buildBilingualDraft());
      flashButton(dom.copyBilingualButton, "Copied");
    });
  }

  if (dom.presentationModeButton) {
    dom.presentationModeButton.addEventListener("click", function () {
      presentationController.open();
    });
  }

  if (dom.clearSelectionsButton) {
    dom.clearSelectionsButton.addEventListener("click", function () {
      state.pages[mode].selected = [];
      saveState();
      renderSelectedStack();
      renderSentenceControls();
      flashButton(dom.clearSelectionsButton, "Cleared");
    });
  }
}

function render() {
  renderLevelSections();
  renderSelectedStack();
}

function renderLevelSections() {
  const activeLevels = viewLevel ? LEVELS.filter((level) => level.id === viewLevel) : LEVELS;
  dom.levelSections.innerHTML = activeLevels
    .map(function (level) {
      const levelSentences = sentences.filter(function (entry) {
        return entry.level === level.id && !state.pages[mode].hidden.includes(entry.id);
      });

      const cards = levelSentences.map(renderSentenceCard).join("");
      return `
        <details class="level-section" id="level-${level.id}" open>
          <summary>
            <div>
              <strong>${level.label}</strong>
              <span>${level.summary}</span>
            </div>
          </summary>
          <div class="level-section-body">
            ${cards || `<p class="empty-level">All sentences in this level are currently hidden.</p>`}
          </div>
        </details>
      `;
    })
    .join("");

  bindDynamicEvents();
}

function renderSentenceCard(entry) {
  const selected = state.pages[mode].selected.includes(entry.id);
  const level = LEVELS.find(function (item) {
    return item.id === entry.level;
  });
  const fields = entry.fields.map(renderFieldGroup).join("");

  return `
    <article class="sentence-card ${selected ? "is-selected" : ""}" data-sentence-id="${entry.id}">
      <div class="sentence-card-head">
        <div>
          <h3>${entry.title}</h3>
          <p>${level ? level.label : ""}</p>
        </div>
        <div class="sentence-card-actions">
          <label class="select-toggle">
            <input type="checkbox" data-action="select" data-sentence-id="${entry.id}" ${selected ? "checked" : ""} />
            <span>${selected ? "Selected" : "Select"}</span>
          </label>
          <button class="mini-button" type="button" data-action="speak" data-sentence-id="${entry.id}" aria-label="Hear this sentence">🔊</button>
          <button class="mini-button" type="button" data-action="hide" data-sentence-id="${entry.id}">Hide</button>
        </div>
      </div>

      <button class="sentence-preview sentence-preview-button" type="button" data-action="speak" data-sentence-id="${entry.id}" aria-label="Hear this sentence">
        ${renderSentence(entry)}
      </button>

      ${fields ? `<div class="sentence-fields">${fields}</div>` : ""}
    </article>
  `;
}

function renderSentence(entry) {
  const englishHtml = templateHelpers.renderTemplateHtml(entry.english);
  const mandarinHtml = templateHelpers.renderTemplateHtml(entry.mandarin);

  if (mode === "english") {
    return `
      <div class="preview-line preview-target">
        <span class="generated-label">English</span>
        <p>${englishHtml}</p>
      </div>
      <div class="preview-line">
        <span class="generated-label">Mandarin</span>
        <p>${mandarinHtml}</p>
      </div>
    `;
  }

  const pinyinHtml = templateHelpers.renderTemplateHtml(entry.pinyin);
  return `
    <div class="preview-line preview-target">
      <span class="generated-label">Mandarin</span>
      <p>${mandarinHtml}</p>
    </div>
    <div class="preview-line preview-target-secondary">
      <span class="generated-label">Pinyin</span>
      <p>${pinyinHtml}</p>
    </div>
    <div class="preview-line">
      <span class="generated-label">English</span>
      <p>${englishHtml}</p>
    </div>
  `;
}

function renderFieldGroup(fieldKey) {
  const def = FIELD_DEFS[fieldKey];
  if (!def) {
    return "";
  }

  const enKey = `${fieldKey}_en`;
  const zhKey = `${fieldKey}_zh`;
  const pinyinKey = `${fieldKey}_pinyin`;
  const inputs = [];

  if (inputVariants.includes("en")) {
    inputs.push(`
      <label class="field">
        <span>English</span>
        <input data-profile-key="${enKey}" type="text" value="${escapeAttribute(state.profile[enKey] || "")}" placeholder="${escapeAttribute(def.placeholders.en)}" />
      </label>
    `);
  }

  if (inputVariants.includes("zh")) {
    inputs.push(`
      <label class="field">
        <span>Mandarin</span>
        <input data-profile-key="${zhKey}" type="text" value="${escapeAttribute(state.profile[zhKey] || "")}" placeholder="${escapeAttribute(def.placeholders.zh)}" />
      </label>
    `);
  }

  if (inputVariants.includes("pinyin")) {
    inputs.push(`
      <label class="field">
        <span>Pinyin</span>
        <input data-profile-key="${pinyinKey}" type="text" value="${escapeAttribute(state.profile[pinyinKey] || "")}" placeholder="${escapeAttribute(def.placeholders.pinyin)}" />
      </label>
    `);
  }

  return `
    <div class="sentence-field-group">
      <p class="sentence-field-title">${def.label}</p>
      <div class="sentence-field-inputs sentence-field-inputs-${inputs.length}">
        ${inputs.join("")}
      </div>
    </div>
  `;
}

function bindDynamicEvents() {
  dom.levelSections.querySelectorAll('[data-action="select"]').forEach(function (input) {
    input.addEventListener("change", function () {
      const sentenceId = input.getAttribute("data-sentence-id");
      if (!sentenceId) {
        return;
      }

      if (input.checked) {
        addSelected(sentenceId);
      } else {
        removeSelected(sentenceId);
      }

      saveState();
      renderSelectedStack();
      renderSentenceControls();
    });
  });

  dom.levelSections.querySelectorAll('[data-action="hide"]').forEach(function (button) {
    button.addEventListener("click", function () {
      const sentenceId = button.getAttribute("data-sentence-id");
      if (!sentenceId) {
        return;
      }

      addHidden(sentenceId);
      removeSelected(sentenceId);
      saveState();
      render();
    });
  });

  dom.levelSections.querySelectorAll('[data-action="speak"]').forEach(function (button) {
    button.addEventListener("click", function () {
      const sentenceId = button.getAttribute("data-sentence-id");
      if (sentenceId) {
        speakSentenceById(sentenceId);
      }
    });
  });

  dom.levelSections.querySelectorAll("[data-profile-key]").forEach(function (input) {
    input.addEventListener("input", function () {
      const key = input.getAttribute("data-profile-key");
      if (!key) {
        return;
      }

      state.profile[key] = input.value;
      const fieldMeta = translationController.parseProfileFieldKey(key);
      if (fieldMeta && AUTO_TRANSLATE_FIELDS.has(fieldMeta.base)) {
        translationController.handleAutoTranslationFieldEdit(fieldMeta);
      }

      if (key === "name_zh") {
        if (!(state.profile.name_zh || "").trim() || state.profile.name_zh === state.profile.name_zh_auto) {
          state.profile.name_zh_auto_locked = "";
        } else if (state.profile.name_zh_auto && state.profile.name_zh !== state.profile.name_zh_auto) {
          state.profile.name_zh_auto_locked = "1";
        }
      }

      translationController.maybeAutofillNameHanzi(key);
      saveState();
      rerenderPreviewContent();
    });
  });
}

function renderSentenceControls() {
  dom.levelSections.querySelectorAll(".sentence-card").forEach(function (card) {
    const sentenceId = card.getAttribute("data-sentence-id");
    const selected = sentenceId && state.pages[mode].selected.includes(sentenceId);
    const input = card.querySelector('[data-action="select"]');
    const label = card.querySelector(".select-toggle span");

    card.classList.toggle("is-selected", Boolean(selected));
    if (input) {
      input.checked = Boolean(selected);
    }
    if (label) {
      label.textContent = selected ? "Selected" : "Select";
    }
  });
}

function rerenderPreviewContent() {
  dom.levelSections.querySelectorAll(".sentence-card").forEach(function (card) {
    const entry = getEntryById(card.getAttribute("data-sentence-id"));
    if (!entry) {
      return;
    }

    const preview = card.querySelector(".sentence-preview");
    if (preview) {
      preview.innerHTML = renderSentence(entry);
    }
  });

  renderSelectedStack();
}

function renderSelectedStack() {
  const selectedEntries = getSelectedEntries();
  dom.selectedStack.innerHTML =
    selectedEntries.length === 0
      ? `<p class="empty-stack">Nothing selected yet. Add the lines you want to practise.</p>`
      : selectedEntries
          .map(function (entry) {
            const englishHtml = templateHelpers.renderTemplateHtml(entry.english);
            const mandarinHtml = templateHelpers.renderTemplateHtml(entry.mandarin);
            return `
              <article class="selected-card">
                <div class="selected-card-head">
                  <h4>${entry.title}</h4>
                  <button class="mini-button" type="button" data-remove-selected="${entry.id}">Remove</button>
                </div>
                ${
                  mode === "english"
                    ? `
                      <p>${englishHtml}</p>
                      <p class="selected-support">${mandarinHtml}</p>
                    `
                    : `
                      <p>${mandarinHtml}</p>
                      <p class="selected-support">${templateHelpers.renderTemplateHtml(entry.pinyin)}</p>
                      <p class="selected-support">${englishHtml}</p>
                    `
                }
              </article>
            `;
          })
          .join("");

  dom.selectedStack.querySelectorAll("[data-remove-selected]").forEach(function (button) {
    button.addEventListener("click", function () {
      const sentenceId = button.getAttribute("data-remove-selected");
      if (!sentenceId) {
        return;
      }

      removeSelected(sentenceId);
      saveState();
      renderSelectedStack();
      renderSentenceControls();
    });
  });
}

function buildPracticeDraft(selectedEntries) {
  const entries = selectedEntries || getSelectedEntries();
  return entries
    .map(function (entry) {
      if (mode === "english") {
        return templateHelpers.fillTemplate(entry.english);
      }
      return `${templateHelpers.fillTemplate(entry.mandarin)}\n${templateHelpers.fillTemplate(entry.pinyin)}`;
    })
    .join("\n\n");
}

function buildBilingualDraft() {
  return getSelectedEntries()
    .map(function (entry) {
      const lines =
        mode === "english"
          ? [templateHelpers.fillTemplate(entry.english), templateHelpers.fillTemplate(entry.mandarin)]
          : [
              templateHelpers.fillTemplate(entry.english),
              templateHelpers.fillTemplate(entry.mandarin),
              templateHelpers.fillTemplate(entry.pinyin),
            ];
      return lines.join("\n");
    })
    .join("\n\n");
}

function getSelectedEntries() {
  return state.pages[mode].selected.map(getEntryById).filter(Boolean);
}

function getEntryById(sentenceId) {
  return sentences.find(function (entry) {
    return entry.id === sentenceId;
  });
}

function speakSentenceById(sentenceId) {
  const entry = getEntryById(sentenceId);
  if (!entry) {
    return;
  }

  speechController.speak({
    text: mode === "english" ? templateHelpers.fillTemplate(entry.english) : templateHelpers.fillTemplate(entry.mandarin),
    language: mode === "english" ? "en-AU" : "zh-CN",
    rate: mode === "english" ? 0.95 : 0.85,
  });
}

function addSelected(sentenceId) {
  if (!state.pages[mode].selected.includes(sentenceId)) {
    state.pages[mode].selected.push(sentenceId);
  }
}

function removeSelected(sentenceId) {
  state.pages[mode].selected = state.pages[mode].selected.filter(function (id) {
    return id !== sentenceId;
  });
}

function addHidden(sentenceId) {
  if (!state.pages[mode].hidden.includes(sentenceId)) {
    state.pages[mode].hidden.push(sentenceId);
  }
}
