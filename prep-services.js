import { ENGLISH_TERM_TRANSLATIONS, NAME_PINYIN_TO_HANZI } from "./prep-data.js";

export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
    return;
  }

  const temp = document.createElement("textarea");
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

export function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(function () {
    button.textContent = original;
  }, 1200);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

export function createTemplateHelpers({ getState, mode }) {
  function fillTemplate(template) {
    return template.replace(/\{([a-z_]+)\}/g, function (_match, token) {
      return resolveToken(token);
    });
  }

  function renderTemplateHtml(template) {
    return template.replace(/\{([a-z_]+)\}/g, function (_match, token) {
      const value = resolveToken(token);
      const isUserValue = !token.startsWith("target_language_");
      if (!isUserValue) {
        return escapeHtml(value);
      }

      return `<span class="injected-value">${escapeHtml(value)}</span>`;
    });
  }

  function renderSpeechText(template, language) {
    const units = buildSpeechUnits(template, language, resolveSpeechToken);
    return {
      text: units.map(function (unit) {
        return unit.text;
      }).join(""),
      html: units.map(function (unit) {
        const classes = [unit.highlightable ? "speech-unit" : "speech-gap"];
        if (unit.isUserValue && unit.highlightable) {
          classes.push("injected-value");
        }

        const attrs = unit.highlightable
          ? ` data-speech-start="${unit.start}" data-speech-end="${unit.end}"`
          : "";

        return `<span class="${classes.join(" ")}"${attrs}>${escapeHtml(unit.text)}</span>`;
      }).join(""),
    };
  }

  function resolveToken(token) {
    const state = getState();
    return resolveTokenValue(state, token, false, mode);
  }

  function resolveSpeechToken(token) {
    const state = getState();
    return resolveTokenValue(state, token, true, mode);
  }

  return {
    fillTemplate,
    renderTemplateHtml,
    renderSpeechText,
    transliterateNamePinyinToHanzi,
  };
}

function buildSpeechUnits(template, language, resolveToken) {
  const sourceUnits = [];
  const tokenPattern = /\{([a-z_]+)\}/g;
  let cursor = 0;
  let match;

  while ((match = tokenPattern.exec(template))) {
    appendSpeechParts(sourceUnits, template.slice(cursor, match.index), language, false);
    appendSpeechParts(sourceUnits, resolveToken(match[1]), language, !match[1].startsWith("target_language_"));
    cursor = match.index + match[0].length;
  }

  appendSpeechParts(sourceUnits, template.slice(cursor), language, false);

  let position = 0;
  return sourceUnits.map(function (unit) {
    const normalized = {
      text: unit.text,
      highlightable: unit.highlightable,
      isUserValue: unit.isUserValue,
      start: position,
      end: position + unit.text.length,
    };
    position = normalized.end;
    return normalized;
  });
}

function appendSpeechParts(units, text, language, isUserValue) {
  tokenizeSpeech(text, language).forEach(function (part) {
    units.push({
      text: part.text,
      highlightable: part.highlightable,
      isUserValue,
    });
  });
}

function tokenizeSpeech(text, language) {
  if (!text) {
    return [];
  }

  if (language.startsWith("zh")) {
    return Array.from(text).map(function (char) {
      return {
        text: char,
        highlightable: !/[\s，。！？；：、“”‘’（）()《》【】,.!?;:'"~\-]/.test(char),
      };
    });
  }

  const parts = text.match(/(\s+|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|[^A-Za-z0-9\s])/g) || [text];
  return parts.map(function (part) {
    return {
      text: part,
      highlightable: !/^\s+$/.test(part) && /^[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*$/.test(part),
    };
  });
}

function resolveTokenValue(state, token, emptyOnMissing, mode) {
  const dynamic = {
    target_language_en: mode === "english" ? "English" : "Mandarin",
    target_language_zh: mode === "english" ? "英文" : "中文",
    target_language_pinyin: mode === "english" ? "Yīngwén" : "Zhōngwén",
  };

  if (Object.prototype.hasOwnProperty.call(dynamic, token)) {
    return dynamic[token];
  }

  if (Object.prototype.hasOwnProperty.call(state.profile, token) && state.profile[token].trim()) {
    return state.profile[token].trim();
  }

  const separator = token.lastIndexOf("_");
  if (separator === -1) {
    return emptyOnMissing ? "" : "___";
  }

  return fallbackValue(state, token.slice(0, separator), token.slice(separator + 1), emptyOnMissing);
}

function fallbackValue(state, base, variant, emptyOnMissing) {
  if (variant === "zh") {
    const direct = state.profile[`${base}_zh`];
    if (direct && direct.trim()) {
      return direct.trim();
    }

    const suggested = transliterateNamePinyinToHanzi(state.profile[`${base}_pinyin`] || "");
    if (suggested) {
      return suggested;
    }

    const englishFallback = state.profile[`${base}_en`];
    if (englishFallback && englishFallback.trim()) {
      return englishFallback.trim();
    }

    return emptyOnMissing ? "" : "___";
  }

  const attempts =
    variant === "en"
      ? [`${base}_en`, `${base}_zh`, `${base}_pinyin`]
      : [`${base}_pinyin`, `${base}_zh`, `${base}_en`];

  for (let i = 0; i < attempts.length; i += 1) {
    const candidate = state.profile[attempts[i]];
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }

  return emptyOnMissing ? "" : "___";
}

export function transliterateNamePinyinToHanzi(input) {
  const syllables = normalizePinyinName(input);
  if (!syllables.length) {
    return "";
  }

  return syllables.map((syllable) => NAME_PINYIN_TO_HANZI[syllable] || syllable).join("");
}

function normalizePinyinName(input) {
  return stripToneMarks(input)
    .toLowerCase()
    .replaceAll("ü", "v")
    .replace(/[^a-z'\s-]/g, " ")
    .split(/[\s'-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripToneMarks(input) {
  const toneMap = {
    ā: "a", á: "a", ǎ: "a", à: "a",
    ē: "e", é: "e", ě: "e", è: "e",
    ī: "i", í: "i", ǐ: "i", ì: "i",
    ō: "o", ó: "o", ǒ: "o", ò: "o",
    ū: "u", ú: "u", ǔ: "u", ù: "u",
    ǖ: "v", ǘ: "v", ǚ: "v", ǜ: "v",
    ü: "v", ń: "n", ň: "n", ǹ: "n",
  };

  return Array.from(input)
    .map((char) => toneMap[char] || char)
    .join("");
}

export function createTranslationController({ getState, saveState, rerenderPreviewContent }) {
  const translationTimers = {};

  function parseProfileFieldKey(key) {
    const match = key.match(/^(.+)_(en|zh|pinyin)$/);
    if (!match) {
      return null;
    }

    return { base: match[1], variant: match[2] };
  }

  function maybeAutofillNameHanzi(changedKey) {
    if (changedKey !== "name_pinyin") {
      return;
    }

    const state = getState();
    const pinyin = (state.profile.name_pinyin || "").trim();
    const existingHanzi = (state.profile.name_zh || "").trim();
    const previousAuto = (state.profile.name_zh_auto || "").trim();
    const locked = state.profile.name_zh_auto_locked === "1";
    if (!pinyin) {
      return;
    }

    const suggested = transliterateNamePinyinToHanzi(pinyin);
    if (!suggested) {
      return;
    }

    if (!existingHanzi || (!locked && (!previousAuto || existingHanzi === previousAuto))) {
      state.profile.name_zh = suggested;
      state.profile.name_zh_auto = suggested;
    }
  }

  function handleAutoTranslationFieldEdit(fieldMeta) {
    const state = getState();
    const { base, variant } = fieldMeta;
    const lockKey = `${base}_auto_locked`;
    const zhAutoKey = `${base}_zh_auto`;
    const pinyinAutoKey = `${base}_pinyin_auto`;

    if (variant === "en") {
      scheduleAutoTranslation(base);
      return;
    }

    if (variant === "zh") {
      const current = (state.profile[`${base}_zh`] || "").trim();
      const auto = (state.profile[zhAutoKey] || "").trim();
      if (!current || current === auto) {
        state.profile[lockKey] = "";
      } else if (auto && current !== auto) {
        state.profile[lockKey] = "1";
      }
      return;
    }

    const current = (state.profile[`${base}_pinyin`] || "").trim();
    const auto = (state.profile[pinyinAutoKey] || "").trim();
    if (!current || current === auto) {
      state.profile[lockKey] = "";
    } else if (auto && current !== auto) {
      state.profile[lockKey] = "1";
    }
  }

  function scheduleAutoTranslation(base) {
    if (translationTimers[base]) {
      window.clearTimeout(translationTimers[base]);
    }

    translationTimers[base] = window.setTimeout(function () {
      maybeAutofillTranslatedField(base);
    }, 450);
  }

  async function maybeAutofillTranslatedField(base) {
    const state = getState();
    const english = (state.profile[`${base}_en`] || "").trim();
    const zhKey = `${base}_zh`;
    const pinyinKey = `${base}_pinyin`;
    const zhAutoKey = `${base}_zh_auto`;
    const pinyinAutoKey = `${base}_pinyin_auto`;
    const lockKey = `${base}_auto_locked`;
    const locked = state.profile[lockKey] === "1";

    if (!english || locked) {
      return;
    }

    let translated = translateEnglishList(english);
    if (!translated || translated.isPartial) {
      const remoteTranslated = await translateEnglishText(english);
      if (remoteTranslated) {
        translated = remoteTranslated;
      }
    }

    if (!translated) {
      return;
    }

    const currentZh = (state.profile[zhKey] || "").trim();
    const currentPinyin = (state.profile[pinyinKey] || "").trim();
    const previousZhAuto = (state.profile[zhAutoKey] || "").trim();
    const previousPinyinAuto = (state.profile[pinyinAutoKey] || "").trim();

    if (!currentZh || !previousZhAuto || currentZh === previousZhAuto) {
      state.profile[zhKey] = translated.zh;
      state.profile[zhAutoKey] = translated.zh;
    }

    if (!currentPinyin || !previousPinyinAuto || currentPinyin === previousPinyinAuto) {
      state.profile[pinyinKey] = translated.pinyin;
      state.profile[pinyinAutoKey] = translated.pinyin;
    }

    saveState();
    rerenderPreviewContent();
  }

  return {
    parseProfileFieldKey,
    maybeAutofillNameHanzi,
    handleAutoTranslationFieldEdit,
  };
}

function translateEnglishList(input) {
  const terms = input
    .replace(/\s+and\s+/gi, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!terms.length) {
    return null;
  }

  const translated = terms.map((term) => translateEnglishTerm(term));
  return {
    zh: joinChineseTerms(translated.map((item) => item.zh)),
    pinyin: joinPinyinTerms(translated.map((item) => item.pinyin)),
    isPartial: translated.some((item) => item.isFallback),
  };
}

function translateEnglishTerm(term) {
  const direct = ENGLISH_TERM_TRANSLATIONS[term.toLowerCase().trim()];
  if (direct) {
    return { zh: direct.zh, pinyin: direct.pinyin, isFallback: false };
  }

  return { zh: term, pinyin: term, isFallback: true };
}

function joinChineseTerms(terms) {
  if (terms.length <= 1) {
    return terms[0] || "";
  }

  if (terms.length === 2) {
    return `${terms[0]}和${terms[1]}`;
  }

  return `${terms.slice(0, -1).join("、")}和${terms[terms.length - 1]}`;
}

function joinPinyinTerms(terms) {
  if (terms.length <= 1) {
    return terms[0] || "";
  }

  if (terms.length === 2) {
    return `${terms[0]} hé ${terms[1]}`;
  }

  return `${terms.slice(0, -1).join(", ")} hé ${terms[terms.length - 1]}`;
}

async function translateEnglishText(text) {
  try {
    const translatedZh = await fetchGoogleTranslate(text, "en", "zh-CN", ["t"]);
    if (!translatedZh || !translatedZh.translation) {
      return null;
    }

    const transliterated = await fetchGoogleTranslate(translatedZh.translation, "zh-CN", "en", ["rm"]);
    return {
      zh: translatedZh.translation,
      pinyin: transliterated && transliterated.romanization ? transliterated.romanization : translatedZh.translation,
    };
  } catch (_error) {
    return null;
  }
}

async function fetchGoogleTranslate(text, sl, tl, dts) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sl);
  url.searchParams.set("tl", tl);
  url.searchParams.set("q", text);
  dts.forEach((dt) => url.searchParams.append("dt", dt));

  const response = await fetch(url.toString());
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return {
    translation: extractGoogleTranslation(data),
    romanization: extractGoogleRomanization(data),
  };
}

function extractGoogleTranslation(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return "";
  }

  return data[0]
    .map((chunk) => (Array.isArray(chunk) ? chunk[0] || "" : ""))
    .join("")
    .trim();
}

function extractGoogleRomanization(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return "";
  }

  for (let i = 0; i < data[0].length; i += 1) {
    const chunk = data[0][i];
    if (Array.isArray(chunk) && typeof chunk[3] === "string" && chunk[3].trim()) {
      return chunk[3].trim();
    }
  }

  return "";
}

export function createSpeechController() {
  let voices = [];
  let unlocked = false;
  let highlightedNodes = [];

  function prime() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    }

    const unlock = function () {
      if (unlocked) {
        return;
      }

      unlocked = true;
      try {
        window.speechSynthesis.resume();
      } catch (_error) {}
    };

    document.addEventListener("pointerdown", unlock, { passive: true, once: true });
    document.addEventListener("touchstart", unlock, { passive: true, once: true });
  }

  function speak({ text, language, rate, highlightRoot }) {
    if (!("speechSynthesis" in window) || !text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;

    const voice = pickVoice(language);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onboundary = function (event) {
      if (typeof event.charIndex !== "number") {
        return;
      }

      syncSpeechHighlight(highlightRoot, event.charIndex);
    };

    utterance.onend = clearSpeechHighlight;
    utterance.onerror = clearSpeechHighlight;

    clearSpeechHighlight();

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (_error) {}

    window.setTimeout(function () {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (_error) {}
    }, 50);
  }

  function loadVoices() {
    voices = window.speechSynthesis.getVoices() || [];
  }

  function pickVoice(language) {
    const available = voices.length ? voices : window.speechSynthesis.getVoices();
    if (!available || !available.length) {
      return null;
    }

    const preferredPrefixes =
      language === "en-AU"
        ? ["en-AU", "en-GB", "en-US", "en"]
        : ["zh-CN", "zh-HK", "zh-TW", "cmn", "zh"];

    for (let i = 0; i < preferredPrefixes.length; i += 1) {
      const prefix = preferredPrefixes[i].toLowerCase();
      const match = available.find((voice) => (voice.lang || "").toLowerCase().startsWith(prefix));
      if (match) {
        return match;
      }
    }

    return available[0] || null;
  }

  function syncSpeechHighlight(root, charIndex) {
    clearSpeechHighlight();
    if (!root) {
      return;
    }

    const nodes = Array.from(root.querySelectorAll("[data-speech-start][data-speech-end]"));
    let activeNode = nodes.find(function (node) {
      const start = Number(node.getAttribute("data-speech-start"));
      const end = Number(node.getAttribute("data-speech-end"));
      return charIndex >= start && charIndex < end;
    });

    if (!activeNode) {
      activeNode = nodes.find(function (node) {
        const start = Number(node.getAttribute("data-speech-start"));
        return start >= charIndex;
      }) || null;
    }

    if (!activeNode) {
      return;
    }

    activeNode.classList.add("is-speaking");
    highlightedNodes = [activeNode];
  }

  function clearSpeechHighlight() {
    highlightedNodes.forEach(function (node) {
      node.classList.remove("is-speaking");
    });
    highlightedNodes = [];
  }

  return { prime, speak };
}

export function createPresentationController({
  mode,
  getSelectedEntries,
  renderSpeechText,
  speakSentenceById,
  presentationModeButton,
}) {
  let presentationIndex = 0;
  let touchStartX = 0;

  const overlay = document.createElement("div");
  overlay.className = "presentation-overlay";
  overlay.innerHTML = `
    <div class="presentation-shell">
      <div class="presentation-topbar">
        <div class="presentation-counter" id="presentationCounter">0 / 0</div>
        <div class="presentation-topbar-actions">
          <button class="presentation-close" type="button" aria-label="Close presentation mode">×</button>
        </div>
      </div>
      <div class="presentation-stage">
        <button class="presentation-tapzone presentation-tapzone-left" type="button" id="presentationPrevZone" aria-label="Previous phrase"></button>
        <div class="presentation-slide" id="presentationSlide"></div>
        <button class="presentation-tapzone presentation-tapzone-right" type="button" id="presentationNextZone" aria-label="Next phrase"></button>
      </div>
      <div class="presentation-nav">
        <button class="button button-secondary output-button" type="button" id="presentationPrevButton">Previous</button>
        <button class="button button-primary output-button" type="button" id="presentationNextButton">Next</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".presentation-close");
  const prevButton = overlay.querySelector("#presentationPrevButton");
  const nextButton = overlay.querySelector("#presentationNextButton");
  const prevZone = overlay.querySelector("#presentationPrevZone");
  const nextZone = overlay.querySelector("#presentationNextZone");
  const slide = overlay.querySelector("#presentationSlide");

  closeButton.addEventListener("click", close);
  prevButton.addEventListener("click", function () {
    move(-1);
  });
  nextButton.addEventListener("click", function () {
    move(1);
  });
  prevZone.addEventListener("click", function () {
    move(-1);
  });
  nextZone.addEventListener("click", function () {
    move(1);
  });
  slide.addEventListener("click", function () {
    const entry = getSelectedEntries()[presentationIndex];
    if (entry) {
      speakSentenceById(entry.id, slide);
    }
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      close();
    }
  });

  overlay.addEventListener("touchstart", function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  overlay.addEventListener("touchend", function (event) {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 40) {
      return;
    }

    move(delta < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("keydown", function (event) {
    if (!overlay.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowRight") {
      move(1);
    } else if (event.key === "ArrowLeft") {
      move(-1);
    }
  });

  function open() {
    const entries = getSelectedEntries();
    if (!entries.length) {
      if (presentationModeButton) {
        flashButton(presentationModeButton, "Select phrases first");
      }
      return;
    }

    presentationIndex = 0;
    overlay.classList.add("is-open");
    render();
    requestFullscreen();
  }

  function close() {
    overlay.classList.remove("is-open");
    if (document.fullscreenElement && document.fullscreenElement === overlay) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function move(direction) {
    const entries = getSelectedEntries();
    if (!entries.length) {
      return;
    }

    presentationIndex = Math.max(0, Math.min(entries.length - 1, presentationIndex + direction));
    render();
  }

  function render() {
    const entries = getSelectedEntries();
    const counter = overlay.querySelector("#presentationCounter");

    if (!entries.length || !counter) {
      return;
    }

    const entry = entries[presentationIndex];
    slide.innerHTML =
      mode === "english"
        ? `<div class="presentation-main"><span class="speech-track">${renderSpeechText(entry.english, "en-AU").html}</span></div>`
        : `<div class="presentation-main"><span class="speech-track">${renderSpeechText(entry.mandarin, "zh-CN").html}</span></div>`;

    counter.textContent = `${presentationIndex + 1} / ${entries.length}`;
    prevButton.disabled = presentationIndex === 0;
    nextButton.disabled = presentationIndex === entries.length - 1;
  }

  function requestFullscreen() {
    if (!overlay.requestFullscreen) {
      return;
    }

    overlay.requestFullscreen().catch(function () {});
  }

  return { open };
}
