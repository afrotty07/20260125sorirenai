import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { routes, createRun, prepare, answer } from "../src/lib/game.js";
import {
  PORTRAIT_SOURCES,
  PORTRAIT_MOODS,
  portraitAtlas,
  portraitMood,
  reactionMood,
} from "../src/lib/portraits.js";

test("all 24 routes have real four-frame image assets; original aliases are identical", () => {
  assert.deepEqual(
    Object.keys(PORTRAIT_SOURCES).map(Number),
    routes.map((pm) => pm.id),
  );
  const unique = new Set(Object.values(PORTRAIT_SOURCES));
  assert.equal(unique.size, 15);
  assert.deepEqual(
    Object.values(PORTRAIT_MOODS)
      .map((m) => m.frame)
      .sort(),
    [0, 1, 2, 3],
  );
  for (const pm of routes) {
    const source = PORTRAIT_SOURCES[pm.id];
    const atlas = readFileSync(
      new URL(`../public${portraitAtlas(pm.id)}`, import.meta.url),
    );
    assert.equal(atlas.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const width = atlas.readUInt32BE(16),
      height = atlas.readUInt32BE(20);
    assert.equal(width, height);
    assert.equal(width % 2, 0);
    assert.ok(width >= 1024);
    const hash = (id) =>
      createHash("sha256")
        .update(
          readFileSync(
            new URL(`../public/assets/pms/pm_${id}.png`, import.meta.url),
          ),
        )
        .digest("hex");
    assert.equal(
      hash(source),
      hash(pm.id),
      `Cabinet ${pm.id} must preserve its own original artwork`,
    );
  }
  assert.equal(portraitAtlas(99), null);
});

test("expressions follow real reactions, focus, events and all four endings", () => {
  assert.equal(reactionMood(12, 65), "happy");
  assert.equal(reactionMood(12, 80), "blush");
  assert.equal(reactionMood(2, 40, true), "blush");
  assert.equal(reactionMood(-8, 90), "sad");
  assert.equal(reactionMood(0, 90), "serious");
  const base = createRun(1);
  for (const [ending, mood] of [
    ["true", "blush"],
    ["love", "blush"],
    ["partner", "happy"],
    ["farewell", "sad"],
  ])
    assert.equal(portraitMood({ ...base, phase: "ended", ending }), mood);
  assert.equal(
    portraitMood({ ...base, phase: "event", heart: 100 }),
    "serious",
  );
  assert.equal(portraitMood({ ...base, heart: 20 }), "sad");
  assert.equal(portraitMood({ ...base, heart: 65 }), "happy");
  assert.equal(portraitMood({ ...base, chapter: 4, heart: 80 }), "blush");
});

test("positive reactions remain happy at the score ceiling and survive reload", () => {
  const run = answer(prepare({ ...createRun(1), heart: 100 }, "rest"), 0);
  assert.equal(run.feedback.heart, 0);
  assert.equal(run.feedback.emotion, "blush");
  assert.equal(portraitMood(JSON.parse(JSON.stringify(run))), "blush");
  const old = {
    ...run,
    feedback: { ...run.feedback, emotion: undefined, heart: -8 },
  };
  assert.equal(portraitMood(old), "sad");
  assert.equal(
    portraitMood({ ...old, feedback: { heart: 5, emotion: "unknown" } }),
    "blush",
  );
});
