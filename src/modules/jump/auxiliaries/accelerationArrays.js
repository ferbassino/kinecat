const accelerationArrays = (accData = []) => {
  const accX = [];
  const accY = [];
  const accZ = [];
  const accT = [];
  const initialTimestamp = accData[0].timestamp;
  accData.map((el) => {
    accX.push(el.x);
    accY.push(el.y);
    accZ.push(el.z);
    accT.push((el.timestamp - initialTimestamp) / 1000);
  });

  return {
    accX,
    accY,
    accZ,
    accT,
  };
};

export default accelerationArrays;
