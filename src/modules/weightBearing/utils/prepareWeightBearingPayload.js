import { MOTION_TYPE } from "../constants";

export function buildWeightBearingMotionPayload({
  currentClient,
  user,
  bodyWeightKg,
  limitPctBw,
  peakLoadKg,
  peakPctBw,
  timeOverLimitMs,
  exceeded,
  durationMs,
  sampleCount,
  sim,
  side,
  notes,
}) {
  return {
    email: currentClient?.email,
    motionType: MOTION_TYPE,
    corporalPart: "lower_limb",
    segment: "foot",
    side: side || "",
    motion: "weight_bearing",
    testTime: durationMs ? durationMs / 1000 : undefined,
    weight: bodyWeightKg,
    dataObj: {
      bodyWeightKg,
      limitPctBw,
      peakLoadKg,
      peakPctBw,
      timeOverLimitMs,
      exceeded: Boolean(exceeded),
      durationMs,
      sampleCount,
      sim: Boolean(sim),
      side: side || "",
      notes: notes || "",
    },
    clientId: currentClient?._id || currentClient?.id,
    userId: user?.id || user?._id,
  };
}
