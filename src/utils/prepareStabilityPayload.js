const DEFAULT_MAX_ACC_SAMPLES = 500;

export function downsampleAccData(accData, maxPoints = DEFAULT_MAX_ACC_SAMPLES) {
  if (!accData?.length || accData.length <= maxPoints) {
    return accData || [];
  }

  const step = accData.length / maxPoints;
  const downsampled = [];

  for (let i = 0; i < maxPoints; i += 1) {
    downsampled.push(accData[Math.floor(i * step)]);
  }

  return downsampled;
}

export function buildStabilityMotionPayload({
  currentClient,
  user,
  exercise,
  currentData,
  cv,
  permutationEn,
  regularity,
  rms,
  isBaseline,
  analysisVersion,
  ventanas,
  pitch,
  roll,
  bodySide,
  notes,
}) {
  const accData = downsampleAccData(currentData);

  return {
    email: currentClient?.email,
    motionType: "stability",
    accData,
    dataObj: {
      exercise: exercise.name,
      cv,
      permutationEn,
      regularity,
      rms,
      isBaseline,
      analysisVersion,
      ventanas,
      pitch,
      roll,
      bodySide,
      notes,
      sampleCountOriginal: currentData?.length ?? 0,
      sampleCountStored: accData.length,
    },
    clientId: currentClient?._id,
    userId: user.id,
  };
}
