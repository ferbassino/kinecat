const DEFAULT_MAX_GYRO_SAMPLES = 500;

export function downsampleGyroData(gyroData, maxPoints = DEFAULT_MAX_GYRO_SAMPLES) {
  if (!gyroData?.length || gyroData.length <= maxPoints) {
    return gyroData || [];
  }

  const step = gyroData.length / maxPoints;
  const downsampled = [];

  for (let i = 0; i < maxPoints; i += 1) {
    downsampled.push(gyroData[Math.floor(i * step)]);
  }

  return downsampled;
}

export function buildArtroMotionPayload({
  currentClient,
  user,
  segment,
  side,
  movement,
  corporalPart,
  gyroData,
  testTime,
  xAngle,
  yAngle,
  zAngle,
  notes,
}) {
  const storedGyro = downsampleGyroData(gyroData);

  return {
    email: currentClient?.email,
    motionType: "artro",
    corporalPart,
    segment,
    side: side || "",
    motion: movement,
    gyroData: storedGyro,
    testTime,
    dataObj: {
      segment,
      movement,
      side: side || "",
      corporalPart,
      xAngle,
      yAngle,
      zAngle,
      notes,
      sampleCountOriginal: gyroData?.length ?? 0,
      sampleCountStored: storedGyro.length,
    },
    clientId: currentClient?._id,
    userId: user.id,
  };
}
