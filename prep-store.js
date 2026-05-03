import { STORAGE_KEY } from "./prep-data.js";

const STORAGE_VERSION = 3;
const MODES = ["english", "mandarin"];

export function createPrepStore({ mode, storageKey = STORAGE_KEY }) {
  let state = loadState(storageKey);

  function getState() {
    return state;
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function getProfile() {
    return state.profile;
  }

  function setProfileValue(key, value) {
    state.profile[key] = value;
  }

  function getSpeechRate() {
    return state.speechRate;
  }

  function setSpeechRate(value) {
    state.speechRate = normalizeSpeechRate(value);
  }

  function getActiveSession() {
    return ensureActiveSession(state);
  }

  function getSessionPageState(targetMode = mode, session = getActiveSession()) {
    if (!session.pages[targetMode]) {
      session.pages[targetMode] = createEmptyPageState();
    }

    return session.pages[targetMode];
  }

  function getSelectedIds(targetMode = mode, session = getActiveSession()) {
    return getSessionPageState(targetMode, session).selected.slice();
  }

  function getHiddenIds(targetMode = mode, session = getActiveSession()) {
    return getSessionPageState(targetMode, session).hidden.slice();
  }

  function getArchivedSessions() {
    return state.sessions
      .filter(function (session) {
        return session.id !== state.activeSessionId && session.status === "archived";
      })
      .sort(function (left, right) {
        return (right.archivedAt || right.date || "").localeCompare(left.archivedAt || left.date || "");
      });
  }

  function getArchivedSentenceIds(targetMode = mode) {
    const archivedIds = new Set();
    getArchivedSessions().forEach(function (session) {
      getSelectedIds(targetMode, session).forEach(function (sentenceId) {
        archivedIds.add(sentenceId);
      });
    });
    return archivedIds;
  }

  function updateActiveSessionMeta(patch) {
    const session = getActiveSession();
    const previousDate = session.date;

    if (typeof patch.date === "string" && patch.date.trim()) {
      session.date = normalizeSessionDate(patch.date) || session.date;
    }

    if (typeof patch.title === "string") {
      session.title = patch.title.trim() || defaultSessionTitle(session.date);
    } else if (session.date !== previousDate && session.title === defaultSessionTitle(previousDate)) {
      session.title = defaultSessionTitle(session.date);
    }
  }

  function selectSentence(sentenceId, targetMode = mode) {
    const selected = getSessionPageState(targetMode).selected;
    if (!selected.includes(sentenceId)) {
      selected.push(sentenceId);
    }
  }

  function unselectSentence(sentenceId, targetMode = mode) {
    getSessionPageState(targetMode).selected = getSessionPageState(targetMode).selected.filter(function (id) {
      return id !== sentenceId;
    });
  }

  function clearSelections(targetMode = mode) {
    getSessionPageState(targetMode).selected = [];
  }

  function hideSentence(sentenceId, targetMode = mode) {
    const page = getSessionPageState(targetMode);
    if (!page.hidden.includes(sentenceId)) {
      page.hidden.push(sentenceId);
    }

    page.selected = page.selected.filter(function (id) {
      return id !== sentenceId;
    });
  }

  function restoreHidden(targetMode = mode) {
    getSessionPageState(targetMode).hidden = [];
  }

  function startNewSession() {
    const current = getActiveSession();
    if (sessionHasContent(current)) {
      current.status = "archived";
      current.archivedAt = todayStamp();
      current.profileSnapshot = { ...state.profile };
    } else {
      state.sessions = state.sessions.filter(function (session) {
        return session.id !== current.id;
      });
    }

    const nextSession = createSession(state.nextSessionNumber, todayStamp());
    state.nextSessionNumber += 1;
    state.activeSessionId = nextSession.id;
    state.sessions.push(nextSession);
  }

  return {
    getState,
    saveState,
    getProfile,
    setProfileValue,
    getSpeechRate,
    setSpeechRate,
    getActiveSession,
    getSessionPageState,
    getSelectedIds,
    getHiddenIds,
    getArchivedSessions,
    getArchivedSentenceIds,
    updateActiveSessionMeta,
    selectSentence,
    unselectSentence,
    clearSelections,
    hideSentence,
    restoreHidden,
    startNewSession,
  };
}

export function formatSessionDateLabel(value) {
  const date = parseSessionDate(value);
  if (!date) {
    return value || "";
  }

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function loadState(storageKey) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return createDefaultState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch (_error) {
    return createDefaultState();
  }
}

function normalizeState(parsed) {
  if (parsed && parsed.version === STORAGE_VERSION && Array.isArray(parsed.sessions)) {
    return normalizeSessionState(parsed);
  }

  return migrateLegacyState(parsed);
}

function normalizeSessionState(parsed) {
  const sessions = parsed.sessions.map(function (session, index) {
    return normalizeSession(session, index + 1);
  });
  let nextSessionNumber = Math.max(normalizePositiveInteger(parsed.nextSessionNumber), sessions.length + 1);
  let activeSessionId = typeof parsed.activeSessionId === "string" ? parsed.activeSessionId : "";

  if (!activeSessionId || !sessions.some(function (session) { return session.id === activeSessionId; })) {
    const active = sessions.find(function (session) {
      return session.status === "active";
    });
    activeSessionId = active ? active.id : "";
  }

  if (!activeSessionId) {
    const newSession = createSession(nextSessionNumber, todayStamp());
    sessions.push(newSession);
    activeSessionId = newSession.id;
    nextSessionNumber += 1;
  }

  sessions.forEach(function (session) {
    session.status = session.id === activeSessionId ? "active" : "archived";
  });

  return {
    version: STORAGE_VERSION,
    profile: normalizeProfile(parsed.profile),
    speechRate: normalizeSpeechRate(parsed.speechRate),
    nextSessionNumber,
    activeSessionId,
    sessions,
  };
}

function migrateLegacyState(parsed) {
  const state = createDefaultState();
  if (!parsed || typeof parsed !== "object") {
    return state;
  }

  state.profile = normalizeProfile(parsed.profile);
  state.speechRate = normalizeSpeechRate(parsed.speechRate);
  state.sessions[0].pages.english = normalizePageState(parsed.pages && parsed.pages.english);
  state.sessions[0].pages.mandarin = normalizePageState(parsed.pages && parsed.pages.mandarin);
  return state;
}

function createDefaultState() {
  const session = createSession(1, todayStamp());
  return {
    version: STORAGE_VERSION,
    profile: {},
    speechRate: 0.75,
    nextSessionNumber: 2,
    activeSessionId: session.id,
    sessions: [session],
  };
}

function normalizeSession(session, fallbackNumber) {
  const date = normalizeSessionDate(session && session.date) || todayStamp();
  return {
    id: session && typeof session.id === "string" && session.id ? session.id : `session-${fallbackNumber}`,
    title:
      session && typeof session.title === "string" && session.title.trim()
        ? session.title.trim()
        : defaultSessionTitle(date),
    date,
    status: session && session.status === "archived" ? "archived" : "active",
    archivedAt: normalizeSessionDate(session && session.archivedAt) || "",
    profileSnapshot: normalizeOptionalProfile(session && session.profileSnapshot),
    pages: {
      english: normalizePageState(session && session.pages && session.pages.english),
      mandarin: normalizePageState(session && session.pages && session.pages.mandarin),
    },
  };
}

function normalizePageState(page) {
  return {
    selected: Array.isArray(page && page.selected) ? page.selected.filter(Boolean) : [],
    hidden: Array.isArray(page && page.hidden) ? page.hidden.filter(Boolean) : [],
  };
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return {};
  }

  return Object.keys(profile).reduce(function (result, key) {
    result[key] = typeof profile[key] === "string" ? profile[key] : "";
    return result;
  }, {});
}

function normalizeOptionalProfile(profile) {
  const normalized = normalizeProfile(profile);
  return Object.keys(normalized).length ? normalized : null;
}

function normalizeSpeechRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.75;
  }

  return Math.max(0.5, Math.min(1.15, numeric));
}

function normalizePositiveInteger(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return 1;
  }

  return Math.round(numeric);
}

function ensureActiveSession(state) {
  let active = state.sessions.find(function (session) {
    return session.id === state.activeSessionId;
  });

  if (active) {
    return active;
  }

  active = createSession(state.nextSessionNumber, todayStamp());
  state.nextSessionNumber += 1;
  state.activeSessionId = active.id;
  state.sessions.push(active);
  return active;
}

function createSession(number, date) {
  return {
    id: `session-${number}`,
    title: defaultSessionTitle(date),
    date,
    status: "active",
    archivedAt: "",
    profileSnapshot: null,
    pages: MODES.reduce(function (pages, currentMode) {
      pages[currentMode] = createEmptyPageState();
      return pages;
    }, {}),
  };
}

function createEmptyPageState() {
  return {
    selected: [],
    hidden: [],
  };
}

function sessionHasContent(session) {
  return MODES.some(function (currentMode) {
    const page = session.pages[currentMode];
    return page && (page.selected.length || page.hidden.length);
  });
}

function defaultSessionTitle(date) {
  return `${formatSessionDateLabel(date)} Meetup`;
}

function todayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeSessionDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return "";
  }

  return value.trim();
}

function parseSessionDate(value) {
  const normalized = normalizeSessionDate(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
