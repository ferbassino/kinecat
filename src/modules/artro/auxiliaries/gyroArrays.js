const accelerationArrays = (gyroData = [], testTimeInput = 0) => {
  const gyroX = [];
  const gyroY = [];
  const gyroZ = [];
  const arrayGyroTime = [];
  let count = 0;
  gyroData.map((el) => {
    gyroX.push(el.x);
    gyroY.push(el.y);
    gyroZ.push(el.z);
    count += testTimeInput / gyroData.length;
    arrayGyroTime.push(count / 1000);
  });

  return {
    gyroX,
    gyroY,
    gyroZ,
    arrayGyroTime,
  };
};

export default accelerationArrays;
