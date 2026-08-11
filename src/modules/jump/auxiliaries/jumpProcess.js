import getIndexes from "./cmj_Auxiliaries/getIndexes";
import { kinematicAnalysis } from "./cmj_Auxiliaries/kinematicAnalysis.js";
import { validateKinematicAnalysis } from "./cmj_Auxiliaries/validateKinematicAnalysis.js";

// Función para calcular el modo
function getMode(array) {
  const frequency = {};
  let maxFreq = 0;
  let mode = array[0];

  for (const item of array) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      mode = item;
    }
  }

  return mode;
}

export default function jumpProcess(
  accY = [],
  testTime = 0,
  weight = 0,
  accT = []
) {
  const evT = testTime;
  const cMjumpInterv = evT / accY.length;
  const modo = getMode(accY); // reemplazo

  const {
    index1,
    index2,
    index3,
    index4,

    index5,
    index6,
    arrayY0,
    arrayY3,
    arrayY4,
    arrayY4T,
    arrayY3T,
    arrayXAxis,
    arrayY0F,
    arrayY0FLong,
    cMJXAxis,
    cMJXAxisLong,
    arrayY13,
    arrayY13T,
    groundContactTime,
  } = getIndexes(accY, modo, accT);

  const tV = Number((arrayY4T[arrayY4T.length - 1] - arrayY4T[0]).toFixed(2));
  const alturaVuelo = Number(((1 / 8) * 9.81 * Math.pow(tV, 2)).toFixed(3));
  const rSI = Number((alturaVuelo / groundContactTime).toFixed(3));
  const velD = Number(Math.sqrt(2 * 9.81 * alturaVuelo).toFixed(3));

  const results = kinematicAnalysis(arrayY13, arrayY13T, weight, velD);
  const validated = validateKinematicAnalysis(
    results,
    index1,
    index2,
    index3,
    index4,
    index5,
    index6
  );

  const cMJDataObject = {
    arrayY0F,
    cMJXAxis,
    tV,
    alturaVuelo,
    velD,
    takeOffVelocityCalculated: results.takeOffVelocityCalculated,
    cMjumpInterv,
    rSI,
    arrayY13,
    arrayY13T,
    velocity: results.velocity,
    velocidadPonderada: results.velocidadPonderada,
    displacement: results.displacement,
    propulsiveAcceleration: results.propulsiveAcceleration,
    propulsiveAccTime: results.propulsiveAccTime,

    tiempoPropulsivo: results.tiempoPropulsivo,
    distanciaPropulsiva: results.distanciaPropulsiva,
    meanPropulsiveForce: results.meanPropulsiveForce,
    meanPropulsivePower: results.meanPropulsivePower,
    eccPeakVelocity: results.eccPeakVelocity,
    eccPeakForce: results.eccPeakForce,
    eccPeakForceBM: results.eccPeakForceBM,
    eccRFD: results.eccRFD,
    eccRFDBM: results.eccRFDBM,
    eccPeakPower: results.eccPeakPower,
    eccPeakPowerBM: results.eccPeakPowerBM,
    conPeakForce: results.conPeakForce,
    conPeakForceBM: results.conPeakForceBM,
    conPeakPower: results.conPeakPower,
    conPeakPowerBM: results.conPeakPowerBM,
    validated,
  };
  return { cMJDataObject };
}
