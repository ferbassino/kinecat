export const calculateAngles = (accelData) => {
  if (!Array.isArray(accelData) || accelData.length === 0) {
    console.warn("accelData está vacío o no es un array válido");
    return { pitch: 0, roll: 0 };
  }

  let sumPitch = 0;
  let sumRoll = 0;

  accelData.forEach(({ x, y, z }) => {
    // Cálculo del ángulo pitch (frontal)
    let pitch = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    pitch = 180 - Math.max(0, Math.min(180, pitch + 90));

    // Cálculo del ángulo roll (lateral)
    const roll = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);

    sumPitch += pitch;
    sumRoll += roll;
  });

  const avgPitch = sumPitch / accelData.length;
  const avgRoll = sumRoll / accelData.length;

  return {
    pitch: Math.round(avgPitch),
    roll: Math.round(avgRoll),
  };
};

export const angleColor = (angle, isPitch) => {
  if (isPitch) {
    // Colores para pitch (0-180°)
    if (angle < 60) return "#a855f7"; // Morado para ángulos bajos
    if (angle < 120) return "#ec4899"; // Rosa para ángulos medios
    return "#ef4444"; // Rojo para ángulos altos
  } else {
    // Colores para roll (-90° a 90°)
    return angle > 0 ? "#a3e635" : "#00ffff"; // Verde/Cian
  }
};
