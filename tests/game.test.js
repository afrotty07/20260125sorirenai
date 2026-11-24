import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAPTERS,
  EVENTS,
  ENDINGS,
  routes,
  createRun,
  prepare,
  answer,
  answerEvent,
  advance,
  getEnding,
  validRun,
  recordRun,
  mergeRecords,
  cleanText,
} from "../src/lib/game.js";
import { loadRun, readStorage, writeStorage } from "../src/lib/storage.js";

function seeded(seed) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test("ending boundaries and priority", () => {
  for (const [heart, support, expected] of [
    [80, 65, "true"],
    [79, 65, "love"],
    [80, 64, "love"],
    [70, 0, "love"],
    [69, 65, "partner"],
    [0, 100, "partner"],
    [69, 64, "farewell"],
  ])
    assert.equal(getEnding({ heart, support }), expected);
});

test("all 24 routes and all 12 event pairings can reach every ending through legal play", () => {
  const random = seeded(20261118);
  let paths = 0;
  for (const pm of routes)
    for (const first of EVENTS)
      for (const second of EVENTS.filter((e) => e.id !== first.id)) {
        const found = new Set();
        for (let trial = 0; trial < 2500 && found.size < 4; trial++) {
          let run = { ...createRun(pm.id), events: [first.id, second.id] };
          let transitions = 0;
          while (run.phase !== "ended") {
            assert.ok(transitions++ < 30, "no softlock");
            if (run.phase === "prepare") {
              const actions = run.energy
                ? ["listen", "research", "rest"]
                : ["rest"];
              run = prepare(
                run,
                actions[Math.floor(random() * actions.length)],
              );
            } else if (run.phase === "dialogue") {
              if (run.energy >= 2) run = { ...run, focused: random() > 0.5 };
              run = answer(run, Math.floor(random() * 3));
            } else if (run.phase === "event") {
              const event = EVENTS.find(
                (e) => e.id === run.events[run.chapter === 1 ? 0 : 1],
              );
              const choices = event.choices
                .map((c, i) => ({ c, i }))
                .filter(({ c }) => run.energy + c.energy >= 0);
              run = answerEvent(
                run,
                choices[Math.floor(random() * choices.length)].i,
              );
            } else run = advance(run);
            assert.ok(validRun(run), JSON.stringify(run));
          }
          assert.equal(run.history.length, 7);
          assert.equal(run.chapter, CHAPTERS.length - 1);
          found.add(run.ending);
          paths++;
        }
        assert.deepEqual(
          [...found].sort(),
          Object.keys(ENDINGS).sort(),
          `${pm.id}: ${first.id}, ${second.id}`,
        );
      }
  console.log(
    `Verified ${paths} complete playthroughs across 288 route/event combinations.`,
  );
});

test("preparation and answers cannot be repeated or spend unavailable energy", () => {
  const initial = createRun(1);
  const prepared = prepare(initial, "listen");
  assert.equal(prepare(prepared, "listen"), prepared);
  assert.equal(prepared.heart, 48);
  assert.equal(prepared.energy, 2);
  const response = answer({ ...prepared, focused: true }, 0);
  assert.equal(response.energy, 0);
  assert.equal(answer(response, 0), response);
  assert.equal(prepare({ ...initial, energy: 0 }, "research").energy, 0);
  assert.equal(prepare({ ...initial, energy: 4 }, "rest").energy, 5);
  assert.equal(
    answer({ ...prepared, energy: 1, focused: true }, 0).phase,
    "dialogue",
  );
  assert.equal(answer(prepared, 999), prepared);
});

test("events happen exactly after chapters two and four, with safe fatigue choices", () => {
  let run = createRun(1);
  for (let i = 0; i < 5; i++) {
    run = answer(prepare(run, "rest"), 0);
    run = advance(run);
    if ([1, 3].includes(i)) {
      assert.equal(run.phase, "event");
      const depleted = { ...run, energy: 0 };
      assert.equal(answerEvent(depleted, 1), depleted);
      run = advance(answerEvent(depleted, 2));
    } else assert.notEqual(run.phase, "event");
  }
  assert.equal(run.phase, "ended");
  assert.equal(run.history.length, 7);
});

test("save validation rejects corrupted states and accepts every round-trip phase", () => {
  const initial = createRun(1);
  for (const bad of [
    null,
    {},
    { ...initial, pmId: 99 },
    { ...initial, chapter: 5 },
    { ...initial, order: [0, 0, 2] },
    { ...initial, events: ["missing", "press"] },
    { ...initial, phase: "event" },
    { ...initial, energy: -1 },
    { ...initial, heart: Infinity },
    { ...initial, phase: "feedback", feedback: null },
    { ...initial, history: [null] },
  ])
    assert.equal(validRun(bad), false);
  assert.equal(validRun(JSON.parse(JSON.stringify(initial))), true);
  const feedback = answer(prepare(initial, "listen"), 0);
  assert.equal(validRun(JSON.parse(JSON.stringify(feedback))), true);
});

test("records are route-specific, idempotent, and invalid cloud records are ignored", () => {
  const base = { ...createRun(1), phase: "ended", ending: "love" };
  const records = recordRun([], base);
  assert.equal(recordRun(records, base), records);
  const second = { ...createRun(5), phase: "ended", ending: "true" };
  const combined = recordRun(records, second);
  assert.equal(combined.length, 2);
  assert.deepEqual(
    combined.map((r) => r.pmId),
    [1, 5],
  );
  assert.equal(
    mergeRecords(combined, combined, null, [{ ...combined[0], ending: "fake" }])
      .length,
    2,
  );
});

test("local saves survive reload, legacy progress migrates, corrupt JSON and unavailable storage recover", () => {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
  const run = answer(prepare(createRun(24), "listen"), 0);
  assert.equal(writeStorage("pmRomanceRunV2", run), true);
  assert.deepEqual(loadRun(), run);
  map.set("pmRomanceRunV2", "broken json");
  assert.equal(loadRun(), null);
  map.set(
    "pmSuspendedGame",
    JSON.stringify({ pmId: 5, score: 120, currentStepIndex: 3 }),
  );
  assert.equal(loadRun().chapter, 3);
  assert.equal(loadRun().heart, 100);
  map.set(
    "pmSuspendedGame",
    JSON.stringify({ pmId: 99, score: 20, currentStepIndex: 3 }),
  );
  assert.equal(loadRun(), null);
  globalThis.localStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("full");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  assert.equal(readStorage("x", "fallback"), "fallback");
  assert.equal(writeStorage("x", {}), false);
  delete globalThis.localStorage;
});

test("dialogue keeps intentional pauses and removes punctuation corruption and ending spoilers", () => {
  assert.equal(
    cleanText("「……私は。、。、。君を。,。待つ。」（ハッピーエンドへ）"),
    "「……私は君を待つ。」",
  );
  for (const pm of routes)
    for (const step of pm.steps) {
      assert.equal(step.choices.length, 3);
      for (const text of [
        step.scenario,
        ...step.choices.flatMap((c) => [c.text, c.feedback]),
      ]) {
        assert.ok(text.length > 0);
        assert.doesNotMatch(text, /[、。,，]{2,}|ハッピーエンドへ/);
      }
    }
});
