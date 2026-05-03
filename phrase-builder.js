(function () {
  const STORAGE_KEY = "mesc_phrase_builder_state_v1";

  const templates = [
    {
      id: "hello_name",
      title: "Hello, my name is...",
      description: "Basic introduction with your name.",
      defaultSelected: true,
      getLines(state) {
        const name = valueOrPlaceholder(state.name);
        return {
          english: `Hello, my name is ${name}.`,
          mandarin: `你好，我叫${name}。`,
          pinyin: `Nǐ hǎo, wǒ jiào ${name}.`,
        };
      },
    },
    {
      id: "from",
      title: "I am from...",
      description: "Country or hometown.",
      defaultSelected: true,
      getLines(state) {
        return {
          english: `I am from ${pickValue(state.from_en, state.from_zh)}.`,
          mandarin: `我来自${pickValue(state.from_zh, state.from_en)}。`,
          pinyin: `Wǒ láizì ${pickValue(state.from_pinyin, state.from_zh, state.from_en)}.`,
        };
      },
    },
    {
      id: "live",
      title: "I live in...",
      description: "Current city or area.",
      defaultSelected: true,
      getLines(state) {
        return {
          english: `I live in ${pickValue(state.live_en, state.live_zh)}.`,
          mandarin: `我住在${pickValue(state.live_zh, state.live_en)}。`,
          pinyin: `Wǒ zhù zài ${pickValue(state.live_pinyin, state.live_zh, state.live_en)}.`,
        };
      },
    },
    {
      id: "work",
      title: "I work as...",
      description: "Use this if you want a work sentence.",
      defaultSelected: true,
      getLines(state) {
        return {
          english: `I work as a ${pickValue(state.work_en, state.work_zh)}.`,
          mandarin: `我是做${pickValue(state.work_zh, state.work_en)}的。`,
          pinyin: `Wǒ shì zuò ${pickValue(state.work_pinyin, state.work_zh, state.work_en)} de.`,
        };
      },
    },
    {
      id: "study",
      title: "I study...",
      description: "Use this if you want a study sentence.",
      defaultSelected: false,
      getLines(state) {
        return {
          english: `I study ${pickValue(state.study_en, state.study_zh)}.`,
          mandarin: `我学习${pickValue(state.study_zh, state.study_en)}。`,
          pinyin: `Wǒ xuéxí ${pickValue(state.study_pinyin, state.study_zh, state.study_en)}.`,
        };
      },
    },
    {
      id: "reason",
      title: "I am learning because...",
      description: "Explain why you are learning.",
      defaultSelected: true,
      getLines(state) {
        const isMandarin = state.learningLanguage === "mandarin";
        const englishObject = isMandarin ? "Mandarin" : "English";
        const mandarinObject = isMandarin ? "中文" : "英文";
        const pinyinObject = isMandarin ? "Zhōngwén" : "Yīngwén";

        return {
          english: `I am learning ${englishObject} because ${pickValue(state.reason_en, state.reason_zh)}.`,
          mandarin: `我学习${mandarinObject}因为${pickValue(state.reason_zh, state.reason_en)}。`,
          pinyin: `Wǒ xuéxí ${pinyinObject} yīnwèi ${pickValue(state.reason_pinyin, state.reason_zh, state.reason_en)}.`,
        };
      },
    },
    {
      id: "hobbies",
      title: "My hobbies are...",
      description: "Useful for easy follow-up conversation.",
      defaultSelected: true,
      getLines(state) {
        return {
          english: `My hobbies are ${pickValue(state.hobbies_en, state.hobbies_zh)}.`,
          mandarin: `我的爱好是${pickValue(state.hobbies_zh, state.hobbies_en)}。`,
          pinyin: `Wǒ de àihào shì ${pickValue(state.hobbies_pinyin, state.hobbies_zh, state.hobbies_en)}.`,
        };
      },
    },
    {
      id: "nice_meet",
      title: "Nice to meet you",
      description: "A simple friendly closing line.",
      defaultSelected: true,
      getLines() {
        return {
          english: "Nice to meet you.",
          mandarin: "很高兴认识你。",
          pinyin: "Hěn gāoxìng rènshi nǐ.",
        };
      },
    },
    {
      id: "please_slow",
      title: "Please speak slowly",
      description: "Helpful support phrase.",
      defaultSelected: false,
      getLines() {
        return {
          english: "Please speak a little more slowly.",
          mandarin: "请说慢一点。",
          pinyin: "Qǐng shuō màn yìdiǎn.",
        };
      },
    },
    {
      id: "say_again",
      title: "Can you say that again?",
      description: "Helpful support phrase.",
      defaultSelected: false,
      getLines() {
        return {
          english: "Can you say that again?",
          mandarin: "你可以再说一次吗？",
          pinyin: "Nǐ kěyǐ zài shuō yícì ma?",
        };
      },
    },
    {
      id: "not_understand",
      title: "I do not understand",
      description: "Helpful support phrase.",
      defaultSelected: false,
      getLines() {
        return {
          english: "I do not understand yet.",
          mandarin: "我还不太明白。",
          pinyin: "Wǒ hái bú tài míngbai.",
        };
      },
    },
    {
      id: "what_mean",
      title: "What does that mean?",
      description: "Helpful support phrase.",
      defaultSelected: false,
      getLines() {
        return {
          english: "What does that mean?",
          mandarin: "那是什么意思？",
          pinyin: "Nà shì shénme yìsi?",
        };
      },
    },
  ];

  const fieldIds = [
    "name",
    "from_en",
    "from_zh",
    "from_pinyin",
    "live_en",
    "live_zh",
    "live_pinyin",
    "work_en",
    "work_zh",
    "work_pinyin",
    "study_en",
    "study_zh",
    "study_pinyin",
    "reason_en",
    "reason_zh",
    "reason_pinyin",
    "hobbies_en",
    "hobbies_zh",
    "hobbies_pinyin",
  ];

  const phraseSelector = document.getElementById("phraseSelector");
  const generatedList = document.getElementById("generatedList");
  const slackDraft = document.getElementById("slackDraft");
  const copyTargetButton = document.getElementById("copyTargetButton");
  const copyBilingualButton = document.getElementById("copyBilingualButton");
  const clearButton = document.getElementById("clearButton");

  if (!phraseSelector || !generatedList || !slackDraft) {
    return;
  }

  renderPhraseSelector();
  loadStateIntoForm();
  bindEvents();
  renderOutput();

  function defaultSelections() {
    const selections = {};
    templates.forEach((template) => {
      selections[template.id] = template.defaultSelected;
    });
    return selections;
  }

  function bindEvents() {
    fieldIds.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) {
        return;
      }

      input.addEventListener("input", handleChange);
    });

    document.querySelectorAll('input[name="learningLanguage"]').forEach((input) => {
      input.addEventListener("change", handleChange);
    });

    phraseSelector.addEventListener("change", handleChange);

    copyTargetButton.addEventListener("click", function () {
      copyText(buildTargetDraft());
      setTemporaryButtonState(copyTargetButton, "Copied");
    });

    copyBilingualButton.addEventListener("click", function () {
      copyText(buildBilingualDraft());
      setTemporaryButtonState(copyBilingualButton, "Copied");
    });

    clearButton.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_KEY);
      resetForm();
      renderOutput();
      setTemporaryButtonState(clearButton, "Cleared");
    });
  }

  function handleChange() {
    saveState();
    renderOutput();
  }

  function renderPhraseSelector() {
    phraseSelector.innerHTML = templates
      .map(
        (template) => `
          <label class="phrase-option">
            <input type="checkbox" data-template-id="${template.id}" ${template.defaultSelected ? "checked" : ""} />
            <span class="phrase-option-copy">
              <strong>${template.title}</strong>
              <small>${template.description}</small>
            </span>
          </label>
        `
      )
      .join("");
  }

  function renderOutput() {
    const state = getState();
    const selectedTemplates = templates.filter((template) => state.selectedTemplates[template.id]);
    const lines = selectedTemplates.map((template) => ({
      template,
      lines: template.getLines(state),
    }));

    slackDraft.value = buildBilingualDraft(lines, state);
    generatedList.innerHTML = lines
      .map(({ template, lines: phraseLines }) => renderPhraseCard(template.title, phraseLines, state))
      .join("");

    generatedList.querySelectorAll("[data-copy-text]").forEach((button) => {
      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-copy-text") || "");
        setTemporaryButtonState(button, "Copied");
      });
    });
  }

  function renderPhraseCard(title, phraseLines, state) {
    const targetLanguage = state.learningLanguage === "mandarin" ? "mandarin" : "english";
    const supportLanguage = targetLanguage === "mandarin" ? "english" : "mandarin";
    const targetText = phraseLines[targetLanguage];
    const supportText = phraseLines[supportLanguage];
    const pinyinText = phraseLines.pinyin;
    const bilingualText =
      targetLanguage === "mandarin"
        ? `${phraseLines.mandarin}\n${phraseLines.pinyin}\n${phraseLines.english}`
        : `${phraseLines.english}\n${phraseLines.mandarin}\n${phraseLines.pinyin}`;

    return `
      <article class="generated-card">
        <div class="generated-head">
          <h4>${title}</h4>
          <div class="generated-actions">
            <button class="mini-button" type="button" data-copy-text="${escapeAttribute(targetText)}">Copy target</button>
            <button class="mini-button" type="button" data-copy-text="${escapeAttribute(bilingualText)}">Copy all</button>
          </div>
        </div>
        <div class="generated-lines">
          <div class="generated-line">
            <span class="generated-label">${targetLanguage === "mandarin" ? "Mandarin" : "English"}</span>
            <p>${escapeHtml(targetText)}</p>
          </div>
          ${
            targetLanguage === "mandarin"
              ? `
                <div class="generated-line">
                  <span class="generated-label">Pinyin</span>
                  <p>${escapeHtml(pinyinText)}</p>
                </div>
              `
              : ""
          }
          <div class="generated-line">
            <span class="generated-label">${targetLanguage === "mandarin" ? "English" : "Mandarin"}</span>
            <p>${escapeHtml(supportText)}</p>
          </div>
          ${
            targetLanguage === "english"
              ? `
                <div class="generated-line">
                  <span class="generated-label">Pinyin</span>
                  <p>${escapeHtml(pinyinText)}</p>
                </div>
              `
              : ""
          }
        </div>
      </article>
    `;
  }

  function buildTargetDraft(precomputedLines, existingState) {
    const state = existingState || getState();
    const lines =
      precomputedLines ||
      templates
        .filter((template) => state.selectedTemplates[template.id])
        .map((template) => ({ lines: template.getLines(state) }));

    const targetKey = state.learningLanguage === "mandarin" ? "mandarin" : "english";
    return lines.map((entry) => entry.lines[targetKey]).join("\n");
  }

  function buildBilingualDraft(precomputedLines, existingState) {
    const state = existingState || getState();
    const lines =
      precomputedLines ||
      templates
        .filter((template) => state.selectedTemplates[template.id])
        .map((template) => ({ lines: template.getLines(state) }));

    const sections = lines.map((entry) => {
      if (state.learningLanguage === "mandarin") {
        return [entry.lines.mandarin, entry.lines.pinyin, entry.lines.english].join("\n");
      }

      return [entry.lines.english, entry.lines.mandarin, entry.lines.pinyin].join("\n");
    });

    return sections.join("\n\n");
  }

  function getState() {
    const selections = defaultSelections();
    phraseSelector.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const id = input.getAttribute("data-template-id");
      if (id) {
        selections[id] = input.checked;
      }
    });

    const state = {
      learningLanguage: getSelectedLanguage(),
      selectedTemplates: selections,
    };

    fieldIds.forEach((id) => {
      const input = document.getElementById(id);
      state[id] = input ? input.value.trim() : "";
    });

    return state;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
  }

  function loadStateIntoForm() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const state = JSON.parse(raw);
      if (state.learningLanguage === "english") {
        const englishRadio = document.querySelector('input[name="learningLanguage"][value="english"]');
        if (englishRadio) {
          englishRadio.checked = true;
        }
      }

      fieldIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input && typeof state[id] === "string") {
          input.value = state[id];
        }
      });

      if (state.selectedTemplates) {
        phraseSelector.querySelectorAll('input[type="checkbox"]').forEach((input) => {
          const id = input.getAttribute("data-template-id");
          if (id && Object.prototype.hasOwnProperty.call(state.selectedTemplates, id)) {
            input.checked = Boolean(state.selectedTemplates[id]);
          }
        });
      }
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function resetForm() {
    const mandarinRadio = document.querySelector('input[name="learningLanguage"][value="mandarin"]');
    if (mandarinRadio) {
      mandarinRadio.checked = true;
    }

    fieldIds.forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.value = "";
      }
    });

    phraseSelector.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const id = input.getAttribute("data-template-id");
      const template = templates.find((entry) => entry.id === id);
      input.checked = Boolean(template && template.defaultSelected);
    });
  }

  function getSelectedLanguage() {
    const selected = document.querySelector('input[name="learningLanguage"]:checked');
    return selected ? selected.value : "mandarin";
  }

  function valueOrPlaceholder(value) {
    return value && value.trim() ? value.trim() : "___";
  }

  function pickValue() {
    for (let i = 0; i < arguments.length; i += 1) {
      const candidate = arguments[i];
      if (candidate && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "___";
  }

  function copyText(text) {
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

  function setTemporaryButtonState(button, label) {
    const original = button.textContent;
    button.textContent = label;
    window.setTimeout(function () {
      button.textContent = original;
    }, 1200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("\n", "&#10;");
  }
})();
