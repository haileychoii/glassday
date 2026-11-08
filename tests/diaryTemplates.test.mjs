import assert from "node:assert/strict";
import test from "node:test";

import { createDiaryTemplate } from "../src/lib/diaryTemplates.ts";

test("diary layout keeps geometry but never copies dated text or image IDs", () => {
  const template = createDiaryTemplate("  Study day  ", [
    {
      id: "note-1",
      type: "text",
      x: 24,
      y: 36,
      width: 300,
      height: 120,
      rotation: 4,
      zIndex: 2,
      text: "Private note for today",
      background: "#fff3f7",
    },
    {
      id: "photo-1",
      type: "photo",
      x: 400,
      y: 50,
      width: 360,
      height: 270,
      rotation: -3,
      zIndex: 1,
      assetId: "private-photo-blob",
    },
  ]);

  assert.equal(template.name, "Study day");
  assert.equal(template.items.length, 2);
  assert.deepEqual(template.items[0], {
    type: "text",
    x: 24,
    y: 36,
    width: 300,
    height: 120,
    rotation: 4,
    zIndex: 2,
    background: "#fff3f7",
    color: undefined,
  });
  assert.equal(template.items[1].type, "photo");
  assert.equal(template.items[1].x, 400);
  assert.ok(template.items.every((item) => !("text" in item) && !("assetId" in item)));
});
