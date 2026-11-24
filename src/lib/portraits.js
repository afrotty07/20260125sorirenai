// Reappointed cabinets share an atlas only when the original artwork is identical.
export const PORTRAIT_SOURCES = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 1,
  6: 4,
  7: 1,
  8: 8,
  9: 3,
  10: 1,
  11: 11,
  12: 12,
  13: 11,
  14: 12,
  15: 11,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  21: 21,
  22: 16,
  23: 23,
  24: 24,
};

export const PORTRAIT_MOODS = {
  happy: { frame: 0, label: "微笑み", line: "「君と話すと、心がほどける。」" },
  blush: { frame: 1, label: "照れ", line: "「……そんな顔で、見ないでくれ。」" },
  serious: {
    frame: 2,
    label: "真剣",
    line: "「君の言葉を、きちんと聞きたい。」",
  },
  sad: { frame: 3, label: "落胆", line: "「……もう少し、君を知りたい。」" },
};

export function portraitAtlas(pmId) {
  const source = PORTRAIT_SOURCES[pmId];
  return source
    ? `/assets/pms/expressions/pm_${source}-expressions-v1.png`
    : null;
}

export function reactionMood(heartChange, finalHeart, focused = false) {
  if (heartChange < 0) return "sad";
  if (heartChange === 0) return "serious";
  return finalHeart >= 75 || focused ? "blush" : "happy";
}

export function portraitMood(run) {
  if (!run) return "serious";
  if (run.phase === "ended") {
    return (
      { true: "blush", love: "blush", partner: "happy", farewell: "sad" }[
        run.ending
      ] ?? "serious"
    );
  }
  if (["feedback", "eventFeedback"].includes(run.phase)) {
    return Object.hasOwn(PORTRAIT_MOODS, run.feedback?.emotion)
      ? run.feedback.emotion
      : reactionMood(run.feedback?.heart ?? 0, run.heart);
  }
  if (run.phase === "event") return "serious";
  if (run.heart < 30) return "sad";
  if (run.focused || (run.chapter >= 3 && run.heart >= 75)) return "blush";
  return run.heart >= 60 ? "happy" : "serious";
}
