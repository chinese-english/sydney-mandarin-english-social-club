(function () {
  const STORAGE_KEY = "mesc_sentence_prep_v2";
  const mode = document.body.getAttribute("data-prep-mode");

  if (!mode) {
    return;
  }

  const LEVELS = [
    { id: "starter", label: "Starter", summary: "Very short lines for first-time speakers." },
    { id: "beginner", label: "Beginner", summary: "Simple personal facts and common topics." },
    { id: "intermediate", label: "Intermediate", summary: "Longer answers and more natural follow-up lines." },
    { id: "advanced", label: "Advanced", summary: "Reflection, nuance, and longer conversation moves." },
  ];

  const FIELD_DEFS = {
    name: fieldDef("Name", "Max", "马克思", "Mǎkèsī"),
    from: fieldDef("Where you are from", "Australia", "澳大利亚", "Àodàlìyà"),
    live: fieldDef("Where you live", "Sydney", "悉尼", "Xīní"),
    suburb: fieldDef("Your suburb or area", "Chatswood", "车士活", "Chēshìhuó"),
    work: fieldDef("Your job", "software engineer", "软件工程师", "ruǎnjiàn gōngchéngshī"),
    study: fieldDef("What you study", "law at university", "大学法律", "dàxué fǎlǜ"),
    reason: fieldDef(
      "Why you are learning",
      "I want to speak with more people in Sydney",
      "我想和更多人交流",
      "wǒ xiǎng hé gèng duō rén jiāoliú"
    ),
    hobbies: fieldDef("Your hobbies", "hiking, reading, and films", "徒步、阅读和电影", "túbù, yuèdú hé diànyǐng"),
    weekend: fieldDef("What you do on weekends", "go for walks and meet friends", "散步和见朋友", "sànbù hé jiàn péngyou"),
    food: fieldDef("Favourite food", "dumplings", "饺子", "jiǎozi"),
    months: fieldDef("How long you have studied", "six months", "六个月", "liù gè yuè"),
    challenge: fieldDef("A challenge you have", "pronunciation", "发音", "fāyīn"),
    goal: fieldDef("A goal you have", "speak more naturally", "更自然地说话", "gèng zìrán de shuōhuà"),
    interesting_place: fieldDef("Something about where you are from", "the beaches", "海滩", "hǎitān"),
    memorable: fieldDef("A memorable experience", "a trip to Japan", "一次日本旅行", "yí cì Rìběn lǚxíng"),
    project: fieldDef("Something you are working on", "improving my speaking confidence", "提高我的口语自信", "tígāo wǒ de kǒuyǔ zìxìn"),
    thought: fieldDef("Something you used to think", "grammar was the hardest part", "语法最难", "yǔfǎ zuì nán"),
    change: fieldDef("Something you think now", "real conversation is the hardest part", "真实对话最难", "zhēnshí duìhuà zuì nán"),
    culture: fieldDef("Why cultural exchange matters", "it helps people understand each other", "它帮助人们互相理解", "tā bāngzhù rénmen hùxiāng lǐjiě"),
    enjoy: fieldDef("Something you enjoy", "meeting people from different backgrounds", "认识不同背景的人", "rènshi bùtóng bèijǐng de rén"),
    improve: fieldDef("Something you want to improve", "my pronunciation and listening", "我的发音和听力", "wǒ de fāyīn hé tīnglì"),
  };

  const SENTENCES = [
    sentence("starter", "hello_name", "Hello, my name is...", ["name"], "Hello, my name is {name_en}.", "你好，我叫{name_zh}。", "Nǐ hǎo, wǒ jiào {name_pinyin}."),
    sentence("starter", "nice_meet", "Nice to meet you", [], "Nice to meet you.", "很高兴认识你。", "Hěn gāoxìng rènshi nǐ."),
    sentence("starter", "from", "I am from...", ["from"], "I am from {from_en}.", "我来自{from_zh}。", "Wǒ láizì {from_pinyin}."),
    sentence("starter", "live", "I live in...", ["live"], "I live in {live_en}.", "我住在{live_zh}。", "Wǒ zhù zài {live_pinyin}."),
    sentence("starter", "learning_reason_short", "I am learning because...", ["reason"], "I am learning {target_language_en} because {reason_en}.", "我学习{target_language_zh}因为{reason_zh}。", "Wǒ xuéxí {target_language_pinyin} yīnwèi {reason_pinyin}."),
    sentence("starter", "hobbies", "My hobbies are...", ["hobbies"], "My hobbies are {hobbies_en}.", "我的爱好是{hobbies_zh}。", "Wǒ de àihào shì {hobbies_pinyin}."),
    sentence("starter", "please_slow", "Please speak slowly", [], "Please speak a little more slowly.", "请说慢一点。", "Qǐng shuō màn yìdiǎn."),
    sentence("starter", "say_again", "Can you say that again?", [], "Can you say that again?", "你可以再说一次吗？", "Nǐ kěyǐ zài shuō yí cì ma?"),
    sentence("starter", "not_understand", "I do not understand yet", [], "I do not understand yet.", "我还不太明白。", "Wǒ hái bú tài míngbai."),
    sentence("starter", "what_mean", "What does that mean?", [], "What does that mean?", "那是什么意思？", "Nà shì shénme yìsi?"),
    sentence("starter", "learning_target", "I want to practise speaking", [], "I want to practise speaking.", "我想练习说话。", "Wǒ xiǎng liànxí shuōhuà."),
    sentence("starter", "intro_close", "Thank you for listening", [], "Thank you for listening.", "谢谢你听我说。", "Xièxie nǐ tīng wǒ shuō."),

    sentence("beginner", "work", "I work as...", ["work"], "I work as a {work_en}.", "我是做{work_zh}的。", "Wǒ shì zuò {work_pinyin} de."),
    sentence("beginner", "study", "I study...", ["study"], "I study {study_en}.", "我学习{study_zh}。", "Wǒ xuéxí {study_pinyin}."),
    sentence("beginner", "suburb", "I live near...", ["suburb"], "I live near {suburb_en}.", "我住在{suburb_zh}附近。", "Wǒ zhù zài {suburb_pinyin} fùjìn."),
    sentence("beginner", "weekend", "On weekends I usually...", ["weekend"], "On weekends I usually {weekend_en}.", "周末我通常{weekend_zh}。", "Zhōumò wǒ tōngcháng {weekend_pinyin}."),
    sentence("beginner", "food", "My favourite food is...", ["food"], "My favourite food is {food_en}.", "我最喜欢的食物是{food_zh}。", "Wǒ zuì xǐhuan de shíwù shì {food_pinyin}."),
    sentence("beginner", "came_meetup", "I came to this meetup because...", ["reason"], "I came to this meetup because {reason_en}.", "我来这个聚会因为{reason_zh}。", "Wǒ lái zhège jùhuì yīnwèi {reason_pinyin}."),
    sentence("beginner", "shy_but", "I am a little shy, but I want to practise", [], "I am a little shy, but I want to practise.", "我有一点害羞，但是我想练习。", "Wǒ yǒu yìdiǎn hàixiū, dànshì wǒ xiǎng liànxí."),
    sentence("beginner", "want_pronunciation", "I want to improve my pronunciation", ["improve"], "I want to improve {improve_en}.", "我想提高{improve_zh}。", "Wǒ xiǎng tígāo {improve_pinyin}."),
    sentence("beginner", "how_long_live", "I have lived here for...", ["months"], "I have been here for {months_en}.", "我在这里已经{months_zh}了。", "Wǒ zài zhèlǐ yǐjīng {months_pinyin} le."),
    sentence("beginner", "like_city", "What I like about Sydney is...", ["interesting_place"], "What I like about Sydney is {interesting_place_en}.", "我喜欢悉尼的是{interesting_place_zh}。", "Wǒ xǐhuan Xīní de shì {interesting_place_pinyin}."),
    sentence("beginner", "ask_question", "What about you?", [], "What about you?", "你呢？", "Nǐ ne?"),
    sentence("beginner", "thank_help", "Thank you for helping me practise", [], "Thank you for helping me practise.", "谢谢你帮我练习。", "Xièxie nǐ bāng wǒ liànxí."),

    sentence("intermediate", "months_study", "I have been learning for...", ["months"], "I have been learning {target_language_en} for {months_en}.", "我学{target_language_zh}已经{months_zh}了。", "Wǒ xué {target_language_pinyin} yǐjīng {months_pinyin} le."),
    sentence("intermediate", "difficult_because", "At first it was difficult because...", ["challenge"], "At first it was difficult because of {challenge_en}.", "一开始很难，因为{challenge_zh}。", "Yì kāishǐ hěn nán, yīnwèi {challenge_pinyin}."),
    sentence("intermediate", "want_to_be_able", "I want to be able to...", ["goal"], "I want to be able to {goal_en}.", "我希望我可以{goal_zh}。", "Wǒ xīwàng wǒ kěyǐ {goal_pinyin}."),
    sentence("intermediate", "enjoy_languages", "One thing I enjoy about languages is...", ["enjoy"], "One thing I enjoy about languages is {enjoy_en}.", "我喜欢语言的一点是{enjoy_zh}。", "Wǒ xǐhuan yǔyán de yìdiǎn shì {enjoy_pinyin}."),
    sentence("intermediate", "free_time", "In my free time I usually...", ["weekend"], "In my free time I usually {weekend_en}.", "空闲的时候，我通常{weekend_zh}。", "Kòngxián de shíhou, wǒ tōngcháng {weekend_pinyin}."),
    sentence("intermediate", "interesting_from", "Something interesting about where I am from is...", ["interesting_place"], "Something interesting about where I am from is {interesting_place_en}.", "我家乡有意思的一点是{interesting_place_zh}。", "Wǒ jiāxiāng yǒuyìsi de yìdiǎn shì {interesting_place_pinyin}."),
    sentence("intermediate", "meet_people", "I want to meet more people through language exchange", [], "I want to meet more people through language exchange.", "我想通过语言交换认识更多人。", "Wǒ xiǎng tōngguò yǔyán jiāohuàn rènshi gèng duō rén."),
    sentence("intermediate", "helpful_phrase", "Please correct me if I say something strangely", [], "Please correct me if I say something strangely.", "如果我说得奇怪，请纠正我。", "Rúguǒ wǒ shuō de qíguài, qǐng jiūzhèng wǒ."),
    sentence("intermediate", "real_people", "I need to practise with real people", [], "If I want to speak with real people, I need to practise with real people.", "如果我想和真人交流，我就要和真人练习。", "Rúguǒ wǒ xiǎng hé zhēnrén jiāoliú, wǒ jiù yào hé zhēnrén liànxí."),
    sentence("intermediate", "pronunciation_public", "Pronunciation improves through real interaction", [], "Pronunciation improves when I speak, get misunderstood, and try again.", "发音是在我开口、被误解、再试一次的时候提高的。", "Fāyīn shì zài wǒ kāikǒu, bèi wùjiě, zài shì yí cì de shíhou tígāo de."),
    sentence("intermediate", "comfortable_now", "I feel more comfortable after repeating myself", [], "I feel more comfortable after repeating the same sentence a few times.", "把同一句话重复几次以后，我会更自在。", "Bǎ tóng yí jù huà chóngfù jǐ cì yǐhòu, wǒ huì gèng zìzài."),
    sentence("intermediate", "follow_up", "What do you usually like to talk about?", [], "What do you usually like to talk about?", "你平时喜欢聊什么？", "Nǐ píngshí xǐhuan liáo shénme?"),

    sentence("advanced", "used_to_think", "I used to think..., but now...", ["thought", "change"], "I used to think {thought_en}, but now I think {change_en}.", "我以前觉得{thought_zh}，但是现在我觉得{change_zh}。", "Wǒ yǐqián juéde {thought_pinyin}, dànshì xiànzài wǒ juéde {change_pinyin}."),
    sentence("advanced", "challenge_now", "One challenge I still have is...", ["challenge"], "One challenge I still have is {challenge_en}.", "我现在还有一个挑战，就是{challenge_zh}。", "Wǒ xiànzài hái yǒu yí gè tiǎozhàn, jiùshì {challenge_pinyin}."),
    sentence("advanced", "misunderstood_try", "When I get misunderstood, I try again", [], "When I get misunderstood, I try again in a simpler way.", "当别人听不懂我的时候，我会用更简单的方法再说一次。", "Dāng biérén tīngbudǒng wǒ de shíhou, wǒ huì yòng gèng jiǎndān de fāngfǎ zài shuō yí cì."),
    sentence("advanced", "best_way", "The best way to learn is regular conversation", [], "I think the best way to learn is regular conversation with strangers.", "我觉得最好的学习方法是经常和陌生人对话。", "Wǒ juéde zuì hǎo de xuéxí fāngfǎ shì jīngcháng hé mòshēngrén duìhuà."),
    sentence("advanced", "culture_exchange", "Cultural exchange matters because...", ["culture"], "Cultural exchange matters because {culture_en}.", "文化交流很重要，因为{culture_zh}。", "Wénhuà jiāoliú hěn zhòngyào, yīnwèi {culture_pinyin}."),
    sentence("advanced", "memorable_experience", "A memorable experience I had was...", ["memorable"], "A memorable experience I had was {memorable_en}.", "我有一个很难忘的经历，就是{memorable_zh}。", "Wǒ yǒu yí gè hěn nánwàng de jīnglì, jiùshì {memorable_pinyin}."),
    sentence("advanced", "working_on", "Something I am working on right now is...", ["project"], "Something I am working on right now is {project_en}.", "我现在正在做的一件事是{project_zh}。", "Wǒ xiànzài zhèngzài zuò de yí jiàn shì shì {project_pinyin}."),
    sentence("advanced", "group_useful", "This group turns study into social practice", [], "This group is useful because it turns language study into real social practice.", "这个小组很有用，因为它把语言学习变成真实的社交练习。", "Zhège xiǎozǔ hěn yǒuyòng, yīnwèi tā bǎ yǔyán xuéxí biànchéng zhēnshí de shèjiāo liànxí."),
    sentence("advanced", "confidence_line", "Confidence grows when I keep speaking", [], "Confidence grows when I keep speaking even when I feel awkward.", "就算觉得尴尬，只要继续说，信心就会增长。", "Jiùsuàn juéde gāngà, zhǐyào jìxù shuō, xìnxīn jiù huì zēngzhǎng."),
    sentence("advanced", "pronunciation_line", "Being understood matters more than sounding perfect", [], "Being understood matters more than sounding perfect.", "被别人听懂比听起来完美更重要。", "Bèi biérén tīngdǒng bǐ tīng qǐlái wánměi gèng zhòngyào."),
    sentence("advanced", "ask_opinion", "What do you think is the hardest part?", [], "What do you think is the hardest part of speaking another language?", "你觉得说另一种语言最难的部分是什么？", "Nǐ juéde shuō lìng yì zhǒng yǔyán zuì nán de bùfen shì shénme?"),
    sentence("advanced", "closing_line", "I enjoyed this conversation", [], "I enjoyed this conversation. Thank you.", "我很喜欢这次聊天。谢谢。", "Wǒ hěn xǐhuan zhè cì liáotiān. Xièxie."),
  ];

  const levelLinksEl = document.getElementById("levelLinks");
  const levelSectionsEl = document.getElementById("levelSections");
  const selectedStackEl = document.getElementById("selectedStack");
  const practiceDraftEl = document.getElementById("practiceDraft");
  const restoreHiddenButton = document.getElementById("restoreHiddenButton");
  const copyPracticeButton = document.getElementById("copyPracticeButton");
  const copyBilingualButton = document.getElementById("copyBilingualButton");
  const clearSelectionsButton = document.getElementById("clearSelectionsButton");

  const viewLevel = new URLSearchParams(window.location.search).get("level");
  let state = loadState();

  render();
  bindStaticEvents();

  function fieldDef(label, enPlaceholder, zhPlaceholder, pinyinPlaceholder) {
    return {
      label,
      placeholders: {
        en: enPlaceholder,
        zh: zhPlaceholder,
        pinyin: pinyinPlaceholder,
      },
    };
  }

  function sentence(level, id, title, fields, english, mandarin, pinyin) {
    return { level, id, title, fields, english, mandarin, pinyin };
  }

  function loadState() {
    const defaults = {
      profile: {},
      pages: {
        english: {
          selected: [],
          hidden: [],
        },
        mandarin: {
          selected: [],
          hidden: [],
        },
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
    restoreHiddenButton.addEventListener("click", function () {
      state.pages[mode].hidden = [];
      saveState();
      render();
      flashButton(restoreHiddenButton, "Restored");
    });

    copyPracticeButton.addEventListener("click", function () {
      copyText(buildPracticeDraft());
      flashButton(copyPracticeButton, "Copied");
    });

    copyBilingualButton.addEventListener("click", function () {
      copyText(buildBilingualDraft());
      flashButton(copyBilingualButton, "Copied");
    });

    clearSelectionsButton.addEventListener("click", function () {
      state.pages[mode].selected = [];
      saveState();
      renderSelectedStack();
      renderSentenceControls();
      flashButton(clearSelectionsButton, "Cleared");
    });
  }

  function render() {
    renderLevelLinks();
    renderLevelSections();
    renderSelectedStack();
  }

  function renderLevelLinks() {
    const page = mode === "english" ? "english.html" : "mandarin.html";
    const links = [
      `<a class="level-chip ${viewLevel ? "" : "is-active"}" href="${page}">All levels</a>`,
      ...LEVELS.map((level) => {
        const active = viewLevel === level.id ? "is-active" : "";
        return `<a class="level-chip ${active}" href="${page}?level=${level.id}">${level.label}</a>`;
      }),
    ];

    levelLinksEl.innerHTML = links.join("");
  }

  function renderLevelSections() {
    const activeLevels = viewLevel ? LEVELS.filter((level) => level.id === viewLevel) : LEVELS;
    levelSectionsEl.innerHTML = activeLevels
      .map((level) => {
        const levelSentences = SENTENCES.filter((entry) => entry.level === level.id).filter(
          (entry) => !state.pages[mode].hidden.includes(entry.id)
        );

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
    const rendered = renderSentence(entry);
    const fields = entry.fields.map((fieldKey) => renderFieldGroup(fieldKey)).join("");

    return `
      <article class="sentence-card ${selected ? "is-selected" : ""}" data-sentence-id="${entry.id}">
        <div class="sentence-card-head">
          <div>
            <h3>${entry.title}</h3>
            <p>${LEVELS.find((level) => level.id === entry.level).label}</p>
          </div>
          <div class="sentence-card-actions">
            <label class="select-toggle">
              <input type="checkbox" data-action="select" data-sentence-id="${entry.id}" ${selected ? "checked" : ""} />
              <span>${selected ? "Selected" : "Select"}</span>
            </label>
            <button class="mini-button" type="button" data-action="hide" data-sentence-id="${entry.id}">Hide</button>
          </div>
        </div>

        <div class="sentence-preview">
          ${rendered}
        </div>

        ${fields ? `<div class="sentence-fields">${fields}</div>` : ""}
      </article>
    `;
  }

  function renderSentence(entry) {
    const english = fillTemplate(entry.english);
    const mandarin = fillTemplate(entry.mandarin);
    const pinyin = fillTemplate(entry.pinyin);

    if (mode === "english") {
      return `
        <div class="preview-line preview-target">
          <span class="generated-label">English</span>
          <p>${escapeHtml(english)}</p>
        </div>
        <div class="preview-line">
          <span class="generated-label">Mandarin</span>
          <p>${escapeHtml(mandarin)}</p>
        </div>
        <div class="preview-line">
          <span class="generated-label">Pinyin</span>
          <p>${escapeHtml(pinyin)}</p>
        </div>
      `;
    }

    return `
      <div class="preview-line preview-target">
        <span class="generated-label">Mandarin</span>
        <p>${escapeHtml(mandarin)}</p>
      </div>
      <div class="preview-line preview-target-secondary">
        <span class="generated-label">Pinyin</span>
        <p>${escapeHtml(pinyin)}</p>
      </div>
      <div class="preview-line">
        <span class="generated-label">English</span>
        <p>${escapeHtml(english)}</p>
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

    return `
      <div class="sentence-field-group">
        <p class="sentence-field-title">${def.label}</p>
        <div class="sentence-field-inputs">
          <label class="field">
            <span>English</span>
            <input data-profile-key="${enKey}" type="text" value="${escapeAttribute(state.profile[enKey] || "")}" placeholder="${escapeAttribute(def.placeholders.en)}" />
          </label>
          <label class="field">
            <span>Mandarin</span>
            <input data-profile-key="${zhKey}" type="text" value="${escapeAttribute(state.profile[zhKey] || "")}" placeholder="${escapeAttribute(def.placeholders.zh)}" />
          </label>
          <label class="field">
            <span>Pinyin</span>
            <input data-profile-key="${pinyinKey}" type="text" value="${escapeAttribute(state.profile[pinyinKey] || "")}" placeholder="${escapeAttribute(def.placeholders.pinyin)}" />
          </label>
        </div>
      </div>
    `;
  }

  function bindDynamicEvents() {
    levelSectionsEl.querySelectorAll('[data-action="select"]').forEach((input) => {
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

    levelSectionsEl.querySelectorAll('[data-action="hide"]').forEach((button) => {
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

    levelSectionsEl.querySelectorAll("[data-profile-key]").forEach((input) => {
      input.addEventListener("input", function () {
        const key = input.getAttribute("data-profile-key");
        if (!key) {
          return;
        }

        state.profile[key] = input.value;
        saveState();
        rerenderPreviewContent();
      });
    });
  }

  function renderSentenceControls() {
    levelSectionsEl.querySelectorAll(".sentence-card").forEach((card) => {
      const sentenceId = card.getAttribute("data-sentence-id");
      const selected = sentenceId && state.pages[mode].selected.includes(sentenceId);
      card.classList.toggle("is-selected", Boolean(selected));
      const input = card.querySelector('[data-action="select"]');
      const label = card.querySelector(".select-toggle span");
      if (input) {
        input.checked = Boolean(selected);
      }
      if (label) {
        label.textContent = selected ? "Selected" : "Select";
      }
    });
  }

  function rerenderPreviewContent() {
    levelSectionsEl.querySelectorAll(".sentence-card").forEach((card) => {
      const sentenceId = card.getAttribute("data-sentence-id");
      const entry = SENTENCES.find((item) => item.id === sentenceId);
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
    const selectedEntries = state.pages[mode].selected
      .map((id) => SENTENCES.find((entry) => entry.id === id))
      .filter(Boolean);

    practiceDraftEl.value = buildPracticeDraft(selectedEntries);
    selectedStackEl.innerHTML =
      selectedEntries.length === 0
        ? `<p class="empty-stack">Nothing selected yet. Add the lines you want to practise.</p>`
        : selectedEntries
            .map((entry) => {
              const english = fillTemplate(entry.english);
              const mandarin = fillTemplate(entry.mandarin);
              const pinyin = fillTemplate(entry.pinyin);
              return `
                <article class="selected-card">
                  <div class="selected-card-head">
                    <h4>${entry.title}</h4>
                    <button class="mini-button" type="button" data-remove-selected="${entry.id}">Remove</button>
                  </div>
                  ${
                    mode === "english"
                      ? `
                        <p>${escapeHtml(english)}</p>
                        <p class="selected-support">${escapeHtml(mandarin)}</p>
                        <p class="selected-support">${escapeHtml(pinyin)}</p>
                      `
                      : `
                        <p>${escapeHtml(mandarin)}</p>
                        <p class="selected-support">${escapeHtml(pinyin)}</p>
                        <p class="selected-support">${escapeHtml(english)}</p>
                      `
                  }
                </article>
              `;
            })
            .join("");

    selectedStackEl.querySelectorAll("[data-remove-selected]").forEach((button) => {
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
    const entries =
      selectedEntries ||
      state.pages[mode].selected
        .map((id) => SENTENCES.find((entry) => entry.id === id))
        .filter(Boolean);

    const lines = entries.map((entry) => {
      if (mode === "english") {
        return fillTemplate(entry.english);
      }
      return `${fillTemplate(entry.mandarin)}\n${fillTemplate(entry.pinyin)}`;
    });

    return lines.join("\n\n");
  }

  function buildBilingualDraft() {
    const entries = state.pages[mode].selected
      .map((id) => SENTENCES.find((entry) => entry.id === id))
      .filter(Boolean);

    return entries
      .map((entry) => [fillTemplate(entry.english), fillTemplate(entry.mandarin), fillTemplate(entry.pinyin)].join("\n"))
      .join("\n\n");
  }

  function fillTemplate(template) {
    return template.replace(/\{([a-z_]+)\}/g, function (_match, token) {
      return resolveToken(token);
    });
  }

  function resolveToken(token) {
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
      return "___";
    }

    const base = token.slice(0, separator);
    const variant = token.slice(separator + 1);
    return fallbackValue(base, variant);
  }

  function fallbackValue(base, variant) {
    const attempts =
      variant === "en"
        ? [`${base}_en`, `${base}_zh`, `${base}_pinyin`]
        : variant === "zh"
          ? [`${base}_zh`, `${base}_en`, `${base}_pinyin`]
          : [`${base}_pinyin`, `${base}_zh`, `${base}_en`];

    for (let i = 0; i < attempts.length; i += 1) {
      const candidate = state.profile[attempts[i]];
      if (candidate && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "___";
  }

  function addSelected(sentenceId) {
    if (!state.pages[mode].selected.includes(sentenceId)) {
      state.pages[mode].selected.push(sentenceId);
    }
  }

  function removeSelected(sentenceId) {
    state.pages[mode].selected = state.pages[mode].selected.filter((id) => id !== sentenceId);
  }

  function addHidden(sentenceId) {
    if (!state.pages[mode].hidden.includes(sentenceId)) {
      state.pages[mode].hidden.push(sentenceId);
    }
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

  function flashButton(button, label) {
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
    return escapeHtml(value).replaceAll('"', "&quot;");
  }
})();
