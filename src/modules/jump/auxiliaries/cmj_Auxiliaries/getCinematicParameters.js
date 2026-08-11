export const getCinematicParameters = (acc, time) => {
  const velocityArray = [0];
  for (let i = 1; i < acc.length; i++) {
    const deltaT = time[i] - time[i - 1];
    const deltaV = 0.5 * (acc[i] + acc[i - 1]) * deltaT;
    velocityArray.push(velocityArray[i - 1] + deltaV);
  }
  const finalVelocity = velocityArray[velocityArray.length - 1];
  const displacementArray = [0];
  for (let i = 1; i < acc.length; i++) {
    const deltaT = time[i] - time[i - 1];
    const deltaV = 0.5 * (velocityArray[i] + velocityArray[i - 1]) * deltaT;
    displacementArray.push(displacementArray[i - 1] + deltaV);
  }
  const finalDisplacement = displacementArray[displacementArray.length - 1];
  return {
    velocityArray,
    finalVelocity,
    displacementArray,
    finalDisplacement,
  };
};
