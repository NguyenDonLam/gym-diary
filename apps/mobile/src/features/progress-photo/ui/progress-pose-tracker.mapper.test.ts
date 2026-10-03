import assert from "node:assert/strict";
import test from "node:test";
import type { ProgressPhoto } from "../types";
import { mapProgressPoseTrackers } from "./progress-pose-tracker.mapper";

function photo(
  id: string,
  group: string | null,
  day: number,
  reference: string | null = null,
): ProgressPhoto {
  return {
    id,
    poseGroupId: group,
    referencePhotoId: reference,
    capturedAt: new Date(2026, 0, day),
    uri: `file:///${id}.jpg`,
    poseData: {
      model: "test",
      modelVersion: 1,
      landmarks: [],
      imageWidth: 100,
      imageHeight: 200,
      overallConfidence: 1,
    },
    alignment: null,
    automaticAlignment: null,
    alignmentStatus: "unavailable",
  };
}

test("separates pose histories and keeps the original reference after later captures", () => {
  const photos = [
    photo("a2", "a", 4, "a1"),
    photo("b1", "b", 3),
    photo("a1", "a", 1),
  ];
  const trackers = mapProgressPoseTrackers(photos);
  assert.deepEqual(trackers, [
    { id: "a", label: "Pose 1", photoCount: 2, referencePhotoId: "a1" },
    { id: "b", label: "Pose 2", photoCount: 1, referencePhotoId: "b1" },
  ]);
  assert.deepEqual(mapProgressPoseTrackers([...photos].reverse()), trackers);
});

test("keeps a tracker after reference deletion without silently promoting a follow-up", () => {
  const trackers = mapProgressPoseTrackers([photo("a2", "a", 2, "deleted")]);
  assert.equal(trackers[0].id, "a");
  assert.equal(trackers[0].referencePhotoId, null);
});

test("custom names follow group IDs when other trackers are removed", () => {
  const names = { a: "Front", b: "Side" };
  const photos = [photo("a1", "a", 1), photo("b1", "b", 2)];
  assert.deepEqual(
    mapProgressPoseTrackers(photos, names).map((tracker) => tracker.label),
    ["Front", "Side"],
  );
  assert.equal(mapProgressPoseTrackers([photos[1]], names)[0].label, "Side");
  assert.equal(mapProgressPoseTrackers(photos, { a: "  " })[0].label, "Pose 1");
});

test("retains legacy photos separately and allows a later valid reference", () => {
  const manual = { ...photo("manual", "a", 1), poseData: null };
  const trackers = mapProgressPoseTrackers([
    manual,
    photo("reference", "a", 2),
    photo("legacy", null, 1),
  ]);
  assert.equal(trackers[0].referencePhotoId, "reference");
  assert.equal(trackers[0].photoCount, 2);
  assert.equal(trackers[1].label, "Other photos");
  assert.deepEqual(mapProgressPoseTrackers([]), []);
});
