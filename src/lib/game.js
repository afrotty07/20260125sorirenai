import { fullPMData } from "../data/pmData.js";
import { reactionMood } from "./portraits.js";

export const CHAPTERS = [
  "出会いの答弁",
  "ふたりの距離",
  "揺れる本音",
  "隣にいる理由",
  "最後の約束",
];
export const ENDINGS = {
  true: {
    label: "恋も、未来も。",
    tag: "TRUE END",
    icon: "✦",
    description:
      "恋心も、人々の信頼も育てたふたり。執務室で交わした小さな約束が、明日へ続く物語になった。",
    condition: "恋心80以上・世論65以上",
  },
  love: {
    label: "ふたりだけの約束",
    tag: "LOVE END",
    icon: "♡",
    description:
      "すべての人に認められなくても、隣にいたい。その想いを確かめ合い、ふたりは肩書きの向こうにある幸せを選んだ。",
    condition: "恋心70以上",
  },
  partner: {
    label: "最高の相棒",
    tag: "PARTNER END",
    icon: "⚑",
    description:
      "恋という言葉では呼べない。でも、背中を預けられる人になれた。同じ未来を見つめるふたりの議事録は、まだ終わらない。",
    condition: "世論65以上・恋心70未満",
  },
  farewell: {
    label: "また、別の歴史で",
    tag: "FAREWELL END",
    icon: "❀",
    description:
      "伝えきれなかった言葉を胸に、時の扉が開く。さよならは、終わりだけを意味しない。次に会うときは、もう少し素直になれるだろうか。",
    condition: "ほかの条件に届かなかった場合",
  },
};

// The supplied dialogue is fictional. Remove repeated punctuation artifacts, not pauses.
export function cleanText(text = "") {
  return text
    .replace(/[、。,，]{2,}/g, "")
    .replace(/（ハッピーエンドへ）/g, "")
    .replace(/。。/g, "。");
}

export const routes = fullPMData.map((pm) => ({
  ...pm,
  personality: cleanText(pm.personality),
  steps: pm.steps.map((step) => ({
    scenario: cleanText(step.scenario),
    choices: step.choices.map((choice, id) => ({
      ...choice,
      id,
      text: cleanText(choice.text),
      feedback: cleanText(choice.feedback),
    })),
  })),
}));

export const EVENTS = [
  {
    id: "press",
    title: "号外！ ふたりの噂",
    scene:
      "執務室を出た瞬間、記者に囲まれた。「おふたりは、どんなご関係ですか？」隣の彼が、そっとあなたの返事を待っている。",
    choices: [
      {
        text: "「大切な人です」と、まっすぐ答える",
        heart: 12,
        support: -6,
        energy: 0,
        feedback:
          "彼の耳が、ほんのり赤くなる。「……そういうことを、皆の前で言うのか」。記事は少し騒がしくなりそう。",
      },
      {
        text: "ふたりで取り組む仕事を、丁寧に説明する",
        heart: 2,
        support: 12,
        energy: -1,
        feedback:
          "説明に駆け回って、少し疲れた。でも、取材陣は納得した様子。彼が小さく「助かった」と囁いた。",
      },
      {
        text: "今日は返答を控え、ふたりでひと息つく",
        heart: 0,
        support: -3,
        energy: 2,
        feedback:
          "中庭のベンチで、ようやく深呼吸。「たまには、こういう時間も必要だな」。噂は残ったけれど、元気が戻った。",
      },
    ],
  },
  {
    id: "letter",
    title: "机の上の、二通の手紙",
    scene:
      "夜の執務室。机には国民からの要望書と、彼からの短い誘い状。今夜、使える時間はあと少し。",
    choices: [
      {
        text: "誘いに応え、彼と夜道を歩く",
        heart: 12,
        support: -4,
        energy: 0,
        feedback:
          "街灯の下、いつもより近い肩。「君と話していると、時を忘れてしまう」。要望書への返事は明日に持ち越した。",
      },
      {
        text: "要望書に、一通ずつ返事を書く",
        heart: -2,
        support: 14,
        energy: -1,
        feedback:
          "気づけば窓の外が明るい。誘いには応えられなかったけれど、あなたの言葉は人々に届いた。",
      },
      {
        text: "明日の予定を整え、早めに休む",
        heart: 1,
        support: 0,
        energy: 2,
        feedback:
          "「無理はするなよ」。短い返事を受け取って、灯りを落とす。明日はきっと、もう少し上手くやれる。",
      },
    ],
  },
  {
    id: "speech",
    title: "予定外の、演説依頼",
    scene:
      "街の集会で、突然あなたにも声がかかった。緊張で言葉が出ない。彼が客席から、うなずいてくれる。",
    choices: [
      {
        text: "彼との小さな思い出を話す",
        heart: 10,
        support: 0,
        energy: 0,
        feedback:
          "不器用な彼の一面に、客席が笑う。彼は困った顔。でも、その口元は少しだけ緩んでいた。",
      },
      {
        text: "街の困りごとに、具体的な提案をする",
        heart: 0,
        support: 14,
        energy: -1,
        feedback:
          "準備した資料が役に立った。拍手が聞こえる。「君自身の言葉、良かったよ」。帰り道の足取りが軽くなった。",
      },
      {
        text: "彼に任せ、舞台裏で水を用意する",
        heart: 4,
        support: 0,
        energy: 1,
        feedback:
          "出番を終えた彼が、水を受け取る。「こういう気遣いに、いちばん救われるんだ」。静かな役目も悪くない。",
      },
    ],
  },
  {
    id: "rain",
    title: "雨音に、ふたりきり",
    scene:
      "帰り道、急に降り出した雨。馬車は一台だけ。彼を見送るか、街の人に譲るか。それとも——。",
    choices: [
      {
        text: "一台の馬車に、ふたりで乗り込む",
        heart: 12,
        support: -4,
        energy: 0,
        feedback:
          "狭い座席で、そっと手が触れた。「……雨が、もう少し続いてもいいな」。窓の外の視線には気づかないふり。",
      },
      {
        text: "困っている人に馬車を譲り、歩いて帰る",
        heart: 2,
        support: 12,
        energy: -1,
        feedback:
          "濡れた肩に、彼の上着がかかった。「君は、放っておけない人だな」。街の人が何度もお礼を言った。",
      },
      {
        text: "軒先で雨宿りし、温かいお茶を飲む",
        heart: 3,
        support: 0,
        energy: 2,
        feedback:
          "雨音と、湯気と、長い沈黙。不思議と居心地は悪くない。「急がなくても、いいか」。心も身体も少し休まった。",
      },
    ],
  },
];

export const clamp = (n, max = 100) => Math.min(max, Math.max(0, n));
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createRun(pmId) {
  return {
    version: 2,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    pmId,
    chapter: 0,
    phase: "prepare",
    heart: 40,
    support: 45,
    energy: 3,
    combo: 0,
    maxCombo: 0,
    history: [],
    order: shuffle([0, 1, 2]),
    events: shuffle(EVENTS.map((e) => e.id)).slice(0, 2),
    hint: false,
    focused: false,
    feedback: null,
  };
}
export function getEnding(run) {
  if (run.heart >= 80 && run.support >= 65) return "true";
  if (run.heart >= 70) return "love";
  if (run.support >= 65) return "partner";
  return "farewell";
}
export function prepare(run, action) {
  if (
    run.phase !== "prepare" ||
    !["listen", "research", "rest"].includes(action)
  )
    return run;
  if (action !== "rest" && run.energy < 1) return run;
  return {
    ...run,
    phase: "dialogue",
    energy: clamp(run.energy + (action === "rest" ? 2 : -1), 5),
    heart: clamp(run.heart + (action === "listen" ? 8 : 0)),
    support: clamp(run.support + (action === "research" ? 8 : 0)),
    hint: action === "listen",
    focused: false,
  };
}
export function choiceEffect(run, choice) {
  const pm = routes.find((p) => p.id === run.pmId);
  const sorted = [...pm.steps[run.chapter].choices].sort(
    (a, b) => b.point - a.point,
  );
  const rank = sorted.findIndex((c) => c.id === choice.id);
  const positive = rank < 2 && choice.point > 0;
  const combo = positive ? run.combo + 1 : 0;
  const bonus = combo >= 2 ? Math.min(combo - 1, 3) : 0;
  const heart = [12, 4, -8][rank] + bonus + (run.focused ? 6 : 0);
  const support = [-2, 8, -6][rank] + (run.focused ? 4 : 0);
  return { heart, support, energy: run.focused ? -2 : 0, combo };
}
function applyEffect(run, effect, entry, phase) {
  const next = {
    ...run,
    phase,
    heart: clamp(run.heart + effect.heart),
    support: clamp(run.support + effect.support),
    energy: clamp(run.energy + (effect.energy ?? 0), 5),
    combo: effect.combo ?? run.combo,
    focused: false,
  };
  const result = {
    ...entry,
    emotion: reactionMood(effect.heart, next.heart, run.focused),
    heart: next.heart - run.heart,
    support: next.support - run.support,
    energy: next.energy - run.energy,
  };
  return {
    ...next,
    maxCombo: Math.max(run.maxCombo, next.combo),
    feedback: result,
    history: [...run.history, result],
  };
}
export function answer(run, choiceId) {
  if (run.phase !== "dialogue") return run;
  const choice = routes
    .find((p) => p.id === run.pmId)
    ?.steps[run.chapter].choices.find((c) => c.id === choiceId);
  if (!choice || (run.focused && run.energy < 2)) return run;
  return applyEffect(
    run,
    choiceEffect(run, choice),
    {
      title: CHAPTERS[run.chapter],
      choice: choice.text,
      text: choice.feedback,
    },
    "feedback",
  );
}
export function answerEvent(run, index) {
  if (run.phase !== "event") return run;
  const event = EVENTS.find(
    (e) => e.id === run.events[run.chapter === 1 ? 0 : 1],
  );
  const choice = event?.choices[index];
  if (!choice || run.energy + choice.energy < 0) return run;
  return applyEffect(
    run,
    choice,
    {
      title: event.title,
      choice: choice.text,
      text: choice.feedback,
      event: true,
    },
    "eventFeedback",
  );
}
export function advance(run) {
  if (!["feedback", "eventFeedback"].includes(run.phase)) return run;
  if (run.phase === "feedback" && [1, 3].includes(run.chapter))
    return { ...run, phase: "event", feedback: null };
  if (run.chapter === 4)
    return { ...run, phase: "ended", ending: getEnding(run) };
  return {
    ...run,
    chapter: run.chapter + 1,
    phase: "prepare",
    hint: false,
    feedback: null,
    order: shuffle([0, 1, 2]),
  };
}

function validEntry(entry) {
  return (
    !!entry &&
    ["title", "choice", "text"].every(
      (key) => typeof entry[key] === "string",
    ) &&
    ["heart", "support", "energy"].every((key) => Number.isFinite(entry[key]))
  );
}
export function validRun(run) {
  return (
    !!run &&
    run.version === 2 &&
    typeof run.id === "string" &&
    routes.some((p) => p.id === run.pmId) &&
    Number.isInteger(run.chapter) &&
    run.chapter >= 0 &&
    run.chapter < 5 &&
    [
      "prepare",
      "dialogue",
      "feedback",
      "event",
      "eventFeedback",
      "ended",
    ].includes(run.phase) &&
    ["heart", "support", "energy", "combo", "maxCombo"].every(
      (key) => Number.isFinite(run[key]) && run[key] >= 0,
    ) &&
    run.heart <= 100 &&
    run.support <= 100 &&
    run.energy <= 5 &&
    Number.isInteger(run.combo) &&
    run.combo <= 5 &&
    Number.isInteger(run.maxCombo) &&
    run.maxCombo <= 5 &&
    typeof run.hint === "boolean" &&
    typeof run.focused === "boolean" &&
    Array.isArray(run.order) &&
    [...run.order].sort().join() === "0,1,2" &&
    Array.isArray(run.events) &&
    run.events.length === 2 &&
    new Set(run.events).size === 2 &&
    run.events.every((id) => EVENTS.some((e) => e.id === id)) &&
    (!["event", "eventFeedback"].includes(run.phase) ||
      [1, 3].includes(run.chapter)) &&
    Array.isArray(run.history) &&
    run.history.length <= 7 &&
    run.history.every(validEntry) &&
    (!["feedback", "eventFeedback"].includes(run.phase) ||
      validEntry(run.feedback)) &&
    (run.phase !== "ended" || Object.hasOwn(ENDINGS, run.ending))
  );
}

export function recordRun(records, run) {
  if (run.phase !== "ended" || records.some((r) => r.runId === run.id))
    return records;
  return [
    ...records,
    {
      runId: run.id,
      pmId: run.pmId,
      ending: run.ending,
      heart: run.heart,
      support: run.support,
      maxCombo: run.maxCombo,
      date: new Date().toISOString(),
    },
  ];
}

export function mergeRecords(...groups) {
  return [
    ...new Map(
      groups
        .filter(Array.isArray)
        .flat()
        .filter(
          (r) =>
            r &&
            typeof r.runId === "string" &&
            routes.some((p) => p.id === r.pmId) &&
            Object.hasOwn(ENDINGS, r.ending) &&
            Number.isFinite(r.heart) &&
            r.heart >= 0 &&
            r.heart <= 100 &&
            Number.isFinite(r.support) &&
            r.support >= 0 &&
            r.support <= 100,
        )
        .map((r) => [r.runId, r]),
    ).values(),
  ];
}
