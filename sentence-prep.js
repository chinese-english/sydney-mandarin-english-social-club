import {
  AUTO_TRANSLATE_FIELDS,
  FIELD_DEFS,
  INPUT_VARIANTS_BY_MODE,
  LEVELS,
  SENTENCES_BY_MODE,
  STORAGE_KEY,
} from "./prep-data.js";
import { renderArchivedSessionsHtml, renderLevelSectionsHtml, renderSelectedStackHtml } from "./prep-render.js";
import {
  copyText,
  createPresentationController,
  createSpeechController,
  createTemplateHelpers,
  createTranslationController,
  escapeAttribute,
  flashButton,
} from "./prep-services.js";
import { createPrepStore, formatSessionDateLabel } from "./prep-store.js";

const mode = document.body.getAttribute("data-prep-mode");

if (!mode) {
  throw new Error("Prep mode is required.");
}

const dom = {
  levelSections: document.getElementById("levelSections"),
  selectedStack: document.getElementById("selectedStack"),
  archivedSessions: document.getElementById("archivedSessions"),
  selectedCountBadge: document.getElementById("selectedCountBadge"),
  archivedCountBadge: document.getElementById("archivedCountBadge"),
  restoreHiddenButton: document.getElementById("restoreHiddenButton"),
  speechRateInput: document.getElementById("speechRateInput"),
  speechRateValue: document.getElementById("speechRateValue"),
  copyPracticeButton: document.getElementById("copyPracticeButton"),
  copyBilingualButton: document.getElementById("copyBilingualButton"),
  presentationModeButton: document.getElementById("presentationModeButton"),
  clearSelectionsButton: document.getElementById("clearSelectionsButton"),
  sessionTitleInput: document.getElementById("sessionTitleInput"),
  sessionDateInput: document.getElementById("sessionDateInput"),
  newSessionButton: document.getElementById("newSessionButton"),
};

const viewLevel = new URLSearchParams(window.location.search).get("level");
const sentences = SENTENCES_BY_MODE[mode] || [];
const inputVariants = INPUT_VARIANTS_BY_MODE[mode] || ["en", "zh", "pinyin"];
const store = createPrepStore({ mode, storageKey: STORAGE_KEY });

const templateHelpers = createTemplateHelpers({
  getState: store.getState,
  mode,
});

const translationController = createTranslationController({
  getState: store.getState,
  saveState: store.saveState,
  rerenderPreviewContent,
});

const speechController = createSpeechController();
const presentationController = createPresentationController({
  mode,
  getSelectedEntries,
  renderSpeechText: templateHelpers.renderSpeechText,
  speakSentenceById,
  presentationModeButton: dom.presentationModeButton,
});

speechController.prime();
render();
bindStaticEvents();

function bindStaticEvents() {
  dom.levelSections.addEventListener("change", handleLevelSectionsChange);
  dom.levelSections.addEventListener("click", handleLevelSectionsClick);
  dom.levelSections.addEventListener("input", handleLevelSectionsInput);
  dom.selectedStack.addEventListener("click", handleSelectedStackClick);

  if (dom.speechRateInput) {
    dom.speechRateInput.value = String(store.getSpeechRate());
    updateSpeechRateLabel();
    dom.speechRateInput.addEventListener("input", function () {
      store.setSpeechRate(dom.speechRateInput.value);
      dom.speechRateInput.value = String(store.getSpeechRate());
      updateSpeechRateLabel();
      store.saveState();
    });
  }

  if (dom.restoreHiddenButton) {
    dom.restoreHiddenButton.addEventListener("click", function () {
      store.restoreHidden();
      store.saveState();
      renderLevelSections();
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
      store.clearSelections();
      store.saveState();
      renderSelectedStack();
      renderLevelSections();
      flashButton(dom.clearSelectionsButton, "Cleared");
    });
  }

  if (dom.sessionTitleInput) {
    dom.sessionTitleInput.addEventListener("input", function () {
      store.updateActiveSessionMeta({ title: dom.sessionTitleInput.value });
      store.saveState();
    });
  }

  if (dom.sessionDateInput) {
    dom.sessionDateInput.addEventListener("change", function () {
      store.updateActiveSessionMeta({ date: dom.sessionDateInput.value });
      store.saveState();
      syncSessionInputs();
    });
  }

  if (dom.newSessionButton) {
    dom.newSessionButton.addEventListener("click", function () {
      store.startNewSession();
      store.saveState();
      render();
      flashButton(dom.newSessionButton, "Started");
    });
  }
}

function updateSpeechRateLabel() {
  if (dom.speechRateValue) {
    const rate = store.getSpeechRate();
    dom.speechRateValue.textContent = rate <= 0.75 ? "Slower" : rate < 0.95 ? "Medium" : "Faster";
  }
}

function render() {
  syncSessionInputs();
  renderLevelSections();
  renderSelectedStack();
  renderArchivedSessions();
}

function syncSessionInputs() {
  const session = store.getActiveSession();
  if (dom.sessionTitleInput) {
    dom.sessionTitleInput.value = session.title;
  }

  if (dom.sessionDateInput) {
    dom.sessionDateInput.value = session.date;
  }
}

function renderLevelSections() {
  dom.levelSections.innerHTML = renderLevelSectionsHtml({
    levels: LEVELS,
    viewLevel,
    entries: sentences,
    selectedIds: new Set(store.getSelectedIds()),
    hiddenIds: new Set(store.getHiddenIds()),
    archivedIds: store.getArchivedSentenceIds(),
    renderSentenceCard,
  });
}

function renderSentenceCard(entry) {
  const selected = store.getSelectedIds().includes(entry.id);
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
            <span>${selected ? "Added" : "Add"}</span>
          </label>
          <button class="mini-button" type="button" data-action="hide" data-sentence-id="${entry.id}">Hide</button>
        </div>
      </div>

      <div class="sentence-preview">
        ${renderSentence(entry)}
      </div>

      ${fields ? `<div class="sentence-fields">${fields}</div>` : ""}
    </article>
  `;
}

function renderSentence(entry) {
  const spokenEnglish = templateHelpers.renderSpeechText(entry.english, "en-AU");
  const spokenMandarin = templateHelpers.renderSpeechText(entry.mandarin, "zh-CN");
  const englishText = templateHelpers.fillTemplate(entry.english);
  const mandarinText = templateHelpers.fillTemplate(entry.mandarin);

  if (mode === "english") {
    return `
      <button class="preview-line preview-target sentence-line-button" type="button" data-action="speak-line" data-speak-text="${escapeAttribute(englishText)}" data-speak-lang="en-AU">
        <span class="generated-label">English</span>
        <p class="speech-track">${spokenEnglish.html}</p>
      </button>
      <button class="preview-line sentence-line-button" type="button" data-action="speak-line" data-speak-text="${escapeAttribute(mandarinText)}" data-speak-lang="zh-CN">
        <span class="generated-label">Mandarin</span>
        <p class="speech-track">${spokenMandarin.html}</p>
      </button>
    `;
  }

  const pinyinHtml = templateHelpers.renderTemplateHtml(entry.pinyin);
  return `
    <button class="preview-line preview-target sentence-line-button" type="button" data-action="speak-line" data-speak-text="${escapeAttribute(mandarinText)}" data-speak-lang="zh-CN">
      <span class="generated-label">Mandarin</span>
      <p class="speech-track">${spokenMandarin.html}</p>
    </button>
    <div class="preview-line preview-target-secondary">
      <span class="generated-label">Pinyin</span>
      <p>${pinyinHtml}</p>
    </div>
    <button class="preview-line sentence-line-button" type="button" data-action="speak-line" data-speak-text="${escapeAttribute(englishText)}" data-speak-lang="en-AU">
      <span class="generated-label">English</span>
      <p class="speech-track">${spokenEnglish.html}</p>
    </button>
  `;
}

function renderFieldGroup(fieldKey) {
  const def = FIELD_DEFS[fieldKey];
  if (!def) {
    return "";
  }

  const profile = store.getProfile();
  const enKey = `${fieldKey}_en`;
  const zhKey = `${fieldKey}_zh`;
  const pinyinKey = `${fieldKey}_pinyin`;
  const inputs = [];

  if (inputVariants.includes("en")) {
    inputs.push(`
      <label class="field">
        <span>English</span>
        <input data-profile-key="${enKey}" type="text" value="${escapeAttribute(profile[enKey] || "")}" placeholder="${escapeAttribute(def.placeholders.en)}" />
      </label>
    `);
  }

  if (inputVariants.includes("zh")) {
    inputs.push(`
      <label class="field">
        <span>Mandarin</span>
        <input data-profile-key="${zhKey}" type="text" value="${escapeAttribute(profile[zhKey] || "")}" placeholder="${escapeAttribute(def.placeholders.zh)}" />
      </label>
    `);
  }

  if (inputVariants.includes("pinyin")) {
    inputs.push(`
      <label class="field">
        <span>Pinyin</span>
        <input data-profile-key="${pinyinKey}" type="text" value="${escapeAttribute(profile[pinyinKey] || "")}" placeholder="${escapeAttribute(def.placeholders.pinyin)}" />
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
  const entries = getSelectedEntries();
  if (dom.selectedCountBadge) {
    dom.selectedCountBadge.textContent = String(entries.length);
  }

  dom.selectedStack.innerHTML = renderSelectedStackHtml({
    entries,
    mode,
    templateHelpers,
    removable: true,
    emptyMessage: "No lines added yet. Add the ones you want to practise.",
  });
}

function renderArchivedSessions() {
  if (!dom.archivedSessions) {
    return;
  }

  const sessions = store.getArchivedSessions();
  if (dom.archivedCountBadge) {
    dom.archivedCountBadge.textContent = String(sessions.length);
  }

  dom.archivedSessions.innerHTML = renderArchivedSessionsHtml({
    sessions,
    mode,
    getEntriesForSession: getSelectedEntries,
    templateHelpers,
    formatSessionDate: formatSessionDateLabel,
  });
}

function buildPracticeDraft(entries, options) {
  const selectedEntries = entries || getSelectedEntries();
  const profileOverride = options && options.profileOverride;
  return selectedEntries
    .map(function (entry) {
      if (mode === "english") {
        return templateHelpers.fillTemplate(entry.english, { profileOverride });
      }

      return `${templateHelpers.fillTemplate(entry.mandarin, { profileOverride })}\n${templateHelpers.fillTemplate(entry.pinyin, { profileOverride })}`;
    })
    .join("\n\n");
}

function buildBilingualDraft(entries, options) {
  const selectedEntries = entries || getSelectedEntries();
  const profileOverride = options && options.profileOverride;

  return selectedEntries
    .map(function (entry) {
      const lines =
        mode === "english"
          ? [
              templateHelpers.fillTemplate(entry.english, { profileOverride }),
              templateHelpers.fillTemplate(entry.mandarin, { profileOverride }),
            ]
          : [
              templateHelpers.fillTemplate(entry.english, { profileOverride }),
              templateHelpers.fillTemplate(entry.mandarin, { profileOverride }),
              templateHelpers.fillTemplate(entry.pinyin, { profileOverride }),
            ];

      return lines.join("\n");
    })
    .join("\n\n");
}

function getSelectedEntries(session) {
  return store.getSelectedIds(mode, session).map(getEntryById).filter(Boolean);
}

function getEntryById(sentenceId) {
  return sentences.find(function (entry) {
    return entry.id === sentenceId;
  });
}

function speakSentenceById(sentenceId, sourceElement) {
  const entry = getEntryById(sentenceId);
  if (!entry) {
    return;
  }

  speakPhrase(
    mode === "english" ? templateHelpers.fillTemplate(entry.english) : templateHelpers.fillTemplate(entry.mandarin),
    mode === "english" ? "en-AU" : "zh-CN",
    sourceElement
  );
}

function speakPhrase(text, language, sourceElement) {
  speechController.speak({
    text,
    language,
    rate: store.getSpeechRate(),
    highlightRoot: findSpeechHighlightRoot(sourceElement),
  });
}

function findSpeechHighlightRoot(sourceElement) {
  if (!sourceElement) {
    return null;
  }

  const directTrack = sourceElement.querySelector && sourceElement.querySelector(".speech-track");
  if (directTrack) {
    return directTrack;
  }

  const preview = sourceElement.closest && sourceElement.closest(".sentence-preview");
  if (preview) {
    return preview.querySelector(".speech-track");
  }

  const card = sourceElement.closest && sourceElement.closest(".sentence-card");
  if (card) {
    return card.querySelector(".preview-target .speech-track");
  }

  const slide = sourceElement.closest && sourceElement.closest(".presentation-slide");
  if (slide) {
    return slide.querySelector(".speech-track");
  }

  return null;
}

function handleLevelSectionsChange(event) {
  const input = event.target.closest && event.target.closest('[data-action="select"]');
  if (!input) {
    return;
  }

  const sentenceId = input.getAttribute("data-sentence-id");
  if (!sentenceId) {
    return;
  }

  if (input.checked) {
    store.selectSentence(sentenceId);
  } else {
    store.unselectSentence(sentenceId);
  }

  store.saveState();
  renderSelectedStack();
  renderLevelSections();
}

function handleLevelSectionsClick(event) {
  const actionElement = event.target.closest && event.target.closest("[data-action]");
  if (!actionElement) {
    return;
  }

  const action = actionElement.getAttribute("data-action");
  if (action === "hide") {
    const sentenceId = actionElement.getAttribute("data-sentence-id");
    if (!sentenceId) {
      return;
    }

    store.hideSentence(sentenceId);
    store.saveState();
    render();
    return;
  }

  if (action === "speak-line") {
    const text = actionElement.getAttribute("data-speak-text");
    const language = actionElement.getAttribute("data-speak-lang");
    if (text && language) {
      speakPhrase(text, language, actionElement);
    }
  }
}

function handleLevelSectionsInput(event) {
  const input = event.target.closest && event.target.closest("[data-profile-key]");
  if (!input) {
    return;
  }

  const key = input.getAttribute("data-profile-key");
  if (!key) {
    return;
  }

  const profile = store.getProfile();
  store.setProfileValue(key, input.value);

  const fieldMeta = translationController.parseProfileFieldKey(key);
  if (fieldMeta && AUTO_TRANSLATE_FIELDS.has(fieldMeta.base)) {
    translationController.handleAutoTranslationFieldEdit(fieldMeta);
  }

  if (key === "name_zh") {
    if (!(profile.name_zh || "").trim() || profile.name_zh === profile.name_zh_auto) {
      profile.name_zh_auto_locked = "";
    } else if (profile.name_zh_auto && profile.name_zh !== profile.name_zh_auto) {
      profile.name_zh_auto_locked = "1";
    }
  }

  translationController.maybeAutofillNameHanzi(key);
  store.saveState();
  rerenderPreviewContent();
}

function handleSelectedStackClick(event) {
  const button = event.target.closest && event.target.closest("[data-remove-selected]");
  if (!button) {
    return;
  }

  const sentenceId = button.getAttribute("data-remove-selected");
  if (!sentenceId) {
    return;
  }

  store.unselectSentence(sentenceId);
  store.saveState();
  renderSelectedStack();
  renderLevelSections();
}
