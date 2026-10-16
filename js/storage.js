// Settings and progress live in this browser only. Storage can be blocked (private mode);
// the app still works for the visit.

const DEFAULTS = {
  "padel.settings": { hand: "right", side: "right" },
  "padel.progress": { solved: {} },
};

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULTS[key], ...JSON.parse(raw) } : { ...DEFAULTS[key] };
  } catch {
    return { ...DEFAULTS[key] };
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not saved; nothing else to do.
  }
}

export const loadSettings = () => read("padel.settings");
export const saveSettings = (s) => write("padel.settings", s);
export const loadProgress = () => read("padel.progress");
export const saveProgress = (p) => write("padel.progress", p);
