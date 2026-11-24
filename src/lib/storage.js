import { createRun, validRun } from "./game.js";

export function readStorage(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function loadRun() {
  const current = readStorage("pmRomanceRunV2");
  if (validRun(current)) return current;
  return migrateLegacyRun(readStorage("pmSuspendedGame"));
}
export function migrateLegacyRun(old) {
  if (
    !old ||
    !Number.isFinite(old.score) ||
    !Number.isInteger(old.currentStepIndex) ||
    old.currentStepIndex < 0 ||
    old.currentStepIndex > 4
  )
    return null;
  const run = createRun(old.pmId);
  run.heart = Math.max(0, Math.min(100, old.score));
  run.chapter = old.currentStepIndex;
  // Old feedback has no complete choice record; resume the current chapter safely.
  return validRun(run) ? run : null;
}
