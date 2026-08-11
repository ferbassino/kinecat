const gyroProcess = (
  gyroX = [],
  gyroY = [],
  gyroZ = [],
  arrayGyroTime = [],
  testTimeInput = 0
) => {
  const evT = testTimeInput / 1000;
  const interv = evT / gyroX.length;

  const xArrayRadAngle = [];
  let xCountRadAngle = 0;
  const xArrayGradAngle = [];
  let xCountGradAngle = 0;

  const yArrayRadAngle = [];
  let yCountRadAngle = 0;
  const yArrayGradAngle = [];
  let yCountGradAngle = 0;

  const zArrayRadAngle = [];
  let zCountRadAngle = 0;
  const zArrayGradAngle = [];
  let zCountGradAngle = 0;

  for (let i = 0; i < gyroX.length - 1; i++) {
    // x
    xCountRadAngle += ((Number(gyroX[i]) + Number(gyroX[i + 1])) * interv) / 2;
    xArrayRadAngle.push(xCountRadAngle);

    xCountGradAngle +=
      ((((Number(gyroX[i]) + Number(gyroX[i + 1])) * interv) / 2) * 180) /
      Math.PI;
    xArrayGradAngle.push(xCountGradAngle);

    // y
    yCountRadAngle += ((Number(gyroY[i]) + Number(gyroY[i + 1])) * interv) / 2;
    yArrayRadAngle.push(yCountRadAngle);

    yCountGradAngle +=
      ((((Number(gyroY[i]) + Number(gyroY[i + 1])) * interv) / 2) * 180) /
      Math.PI;
    yArrayGradAngle.push(yCountGradAngle);

    // z
    zCountRadAngle += ((Number(gyroZ[i]) + Number(gyroZ[i + 1])) * interv) / 2;
    zArrayRadAngle.push(zCountRadAngle);

    zCountGradAngle +=
      ((((Number(gyroZ[i]) + Number(gyroZ[i + 1])) * interv) / 2) * 180) /
      Math.PI;
    zArrayGradAngle.push(zCountGradAngle);
  }

  return {
    xArrayRadAngle,
    xCountRadAngle,
    xArrayGradAngle,
    xCountGradAngle,
    xArrayRadAngle,
    yCountRadAngle,
    yArrayGradAngle,
    yCountGradAngle,
    zArrayRadAngle,
    zCountRadAngle,
    zArrayGradAngle,
    zCountGradAngle,
  };
};

export default gyroProcess;
